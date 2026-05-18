import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from "@/app/api/lib/db";
import { errorResponse } from '../../lib/auth';
import { Subscription } from '../../models/Subscription';
import { PaymentSettings } from '../../models/PaymentSettings';
import { User } from '../../models/User';
import { AffiliateProfile } from '../../models/AffiliateProfile';
import { Commission } from '../../models/Commission';
import { AffiliateSettings } from '@/models/AffiliateSettings';
import Stripe from 'stripe';

async function getConfiguredStripe() {
    const paymentSettings = await PaymentSettings.getSettings();
    const stripeConfig = paymentSettings.getCurrentStripeConfig();

    if (!stripeConfig || !stripeConfig.secretKey) {
        const envSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!envSecretKey) {
            throw new Error('Stripe not configured. Please configure payment settings in admin panel.');
        }

        return new Stripe(envSecretKey, {
            apiVersion: '2023-10-16'
        });
    }

    return new Stripe(String(stripeConfig.secretKey), {
        apiVersion: '2023-10-16'
    });
}

async function getPaymentSettings() {
    return await PaymentSettings.getSettings();
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (!session.subscription || !session.customer) return;

    try {
        const stripe = await getConfiguredStripe();
        const stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        const clerkId = session.metadata?.clerkId;
        if (!clerkId) return;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const plan = session.metadata?.plan || 'basic';
        const interval = session.metadata?.interval || 'month';

        const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice as string);

        await Subscription.create({
            userId: clerkId,
            customerId,
            subscriptionId,
            status: stripeSubscription.status,
            plan,
            priceId: stripeSubscription.items.data[0].price.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            interval,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        });

        // Affiliate Commission Logic
        try {
            const user = await User.findOne({ clerkId });
            if (user?.referredBy) {
                const affiliate = await AffiliateProfile.findOne({ uniqueCode: user.referredBy });

                if (affiliate && affiliate.status === 'active' && affiliate.userId !== clerkId) {
                    // Avoid self-referral
                    const settings = await AffiliateSettings.getSettings();
                    const commissionRate = settings.commissionRate || 0.20; // Default to 20% if missing
                    const commissionAmount = Math.round(invoice.amount_paid * commissionRate); // Amount in cents

                    if (commissionAmount > 0) {
                        await Commission.create({
                            affiliateId: affiliate.userId,
                            referredUserId: clerkId,
                            amount: commissionAmount,
                            status: 'pending',
                            type: 'subscription',
                            sourceId: subscriptionId
                        });

                        affiliate.unpaidBalance += commissionAmount;
                        affiliate.totalEarnings += commissionAmount;
                        await affiliate.save();
                        console.log(`Commission of ${commissionAmount} recorded for affiliate ${affiliate.userId}`);
                    }
                }
            }
        } catch (affiliateError) {
            console.error('Error processing affiliate commission:', affiliateError);
            // Don't throw here, as subscription creation was successful
        }

    } catch (error) {
        console.error('Error handling checkout session completed:', error);
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if (!invoice.subscription || !invoice.customer) return;

    try {
        const stripe = await getConfiguredStripe();
        const stripeSubscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
        );

        const subscription = await Subscription.findOne({
            subscriptionId: invoice.subscription
        });

        if (!subscription) return;

        const status = stripeSubscription.status as 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
        subscription.status = status;
        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

        await subscription.save();
    } catch (error) {
        console.error('Error handling invoice payment succeeded:', error);
    }
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    try {
        const subscription = await Subscription.findOne({
            subscriptionId: stripeSubscription.id
        });

        if (!subscription) return;

        const status = stripeSubscription.status as 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
        subscription.status = status;
        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

        if (stripeSubscription.canceled_at) {
            subscription.canceledAt = new Date(stripeSubscription.canceled_at * 1000);
        }

        await subscription.save();
    } catch (error) {
        console.error('Error handling subscription updated:', error);
    }
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    try {
        await Subscription.findOneAndUpdate(
            { subscriptionId: stripeSubscription.id },
            {
                status: 'canceled',
                canceledAt: new Date()
            }
        );
    } catch (error) {
        console.error('Error handling subscription deleted:', error);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
        }

        const body = await req.text();
        let event: Stripe.Event;

        try {
            const paymentSettings = await getPaymentSettings();
            const stripeConfig = paymentSettings.getCurrentStripeConfig();
            const webhookSecret = stripeConfig?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

            if (!webhookSecret) {
                throw new Error('Stripe webhook secret not configured');
            }

            const stripe = await getConfiguredStripe();
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                String(webhookSecret)
            );
        } catch (error: unknown) {
            console.error('Webhook signature verification failed:', error);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    await handleCheckoutSessionCompleted(session);
                    break;
                }
                case 'invoice.payment_succeeded': {
                    const invoice = event.data.object as Stripe.Invoice;
                    await handleInvoicePaymentSucceeded(invoice);
                    break;
                }
                case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription;
                    await handleSubscriptionUpdated(subscription);
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    await handleSubscriptionDeleted(subscription);
                    break;
                }
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            return NextResponse.json({ received: true });
        } catch (error: unknown) {
            console.error('Error handling webhook event:', error);
            return errorResponse('Failed to process webhook', 500);
        }
    } catch (error: unknown) {
        console.error('Error in webhook handler:', error);
        return errorResponse('Failed to process webhook', 500);
    }
}


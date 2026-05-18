import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "../../../lib/db";
import { AffiliateProfile } from "../../../models/AffiliateProfile";
import { Commission } from "../../../models/Commission";
import { Payout } from "../../../models/Payout";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        // Check Admin Role
        const isAdmin = clerkUser.publicMetadata?.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { affiliateId, amount, transactionId } = await req.json();

        if (!affiliateId || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        const affiliate = await AffiliateProfile.findById(affiliateId);
        if (!affiliate) {
            return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
        }

        // Create Payout Record
        const payout = await Payout.create({
            affiliateId: affiliate.userId, // Using userId (clerkId) as link
            amount: amount,
            status: 'paid',
            method: 'manual',
            transactionId: transactionId || `manual_${Date.now()}`,
        });

        // Update Affiliate Balance
        // We subtract the paid amount from unpaidBalance
        affiliate.unpaidBalance = Math.max(0, affiliate.unpaidBalance - amount);
        await affiliate.save();

        // Mark oldest pending commissions as paid up to the amount (Optional but good for record keeping)
        // For simplicity in this version, we just update the balance. 
        // A more advanced version would match specific commissions.
        // Let's just update all 'pending' commissions for this user to 'paid' if we are paying the full balance?
        // Risky if partial payout.
        // Let's stick to just updating the balance for now as per the plan.

        return NextResponse.json({ success: true, payout });

    } catch (error) {
        console.error("Payout Processing Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

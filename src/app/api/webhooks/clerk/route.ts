import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { errorResponse } from '../../lib/auth';
import type { WebhookEvent } from '@clerk/clerk-sdk-node';

const ADMIN_EMAIL_DOMAINS = ["internetkeeda.com"];

export async function POST(req: NextRequest) {
    try {
        const evt = await req.json() as WebhookEvent;
        
        switch (evt.type) {
            case 'user.created': {
                const { id, email_addresses } = evt.data;
                
                const isAdmin = email_addresses.some((email: { email_address: string }) => 
                    ADMIN_EMAIL_DOMAINS.some(domain => 
                        email.email_address.endsWith(`@${domain}`)
                    )
                );

                const updateData = {
                    publicMetadata: {
                        role: isAdmin ? 'admin' : 'user',
                        status: 'active'
                    }
                };

                const client = await clerkClient();
                await client.users.updateUser(id, updateData);
                break;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Webhook error:', error);
        return errorResponse('Webhook handler failed', 500);
    }
}


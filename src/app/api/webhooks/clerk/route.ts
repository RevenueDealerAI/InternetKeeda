import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { errorResponse } from '../../lib/auth';
import { connectDB } from '../../lib/db';
import { User } from '../../models/User';
import type { WebhookEvent } from '@clerk/clerk-sdk-node';

/**
 * Clerk webhook handler.
 *
 * Two jobs:
 *   1. Mongo User row upsert on user.created / user.updated. Without
 *      this, `User.findOne({ clerkId })` returns null on first
 *      moderation check and /admin/moderation can't tell whether
 *      the user is admin (they always weren't because the row
 *      didn't exist).
 *   2. Optional admin elevation: emails on the configured domains
 *      get Mongo `User.isAdmin = true` AND a mirror in Clerk
 *      `publicMetadata.isAdmin = true` for fast client-side reads.
 *      Mongo is the source of truth; the Clerk mirror exists only so
 *      navbars don't have to fetch /api/users/me on first paint. Use
 *      scripts/grant-admin.ts or scripts/sync-admin-to-clerk.ts to
 *      add or sync admins after sign-up.
 *
 * Signature verification via svix is REQUIRED. Without it, anyone
 * could POST a fake user.created event with email@internetkeeda.com
 * and self-promote. CLERK_WEBHOOK_SECRET must be set in Vercel —
 * see docs/CLERK-WEBHOOK-SETUP.md.
 */

const ADMIN_EMAIL_DOMAINS = ['internetkeeda.com'];

async function verifyWebhook(req: NextRequest): Promise<WebhookEvent | null> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set — refusing all events');
    return null;
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn('[clerk-webhook] missing svix headers');
    return null;
  }

  const body = await req.text();
  try {
    const wh = new Webhook(secret);
    return wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.warn('[clerk-webhook] signature verification failed', err);
    return null;
  }
}

function isAdminByEmail(emails: Array<{ email_address: string }>): boolean {
  return emails.some((e) =>
    ADMIN_EMAIL_DOMAINS.some((d) => e.email_address.toLowerCase().endsWith(`@${d}`)),
  );
}

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    if (!evt) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    await connectDB();

    switch (evt.type) {
      case 'user.created':
      case 'user.updated': {
        const {
          id,
          email_addresses,
          first_name,
          last_name,
          username,
          image_url,
          public_metadata,
        } = evt.data;

        const primaryEmail =
          email_addresses?.[0]?.email_address ?? '';
        const adminByDomain = isAdminByEmail(email_addresses ?? []);

        // Upsert the Mongo User row. Keep isAdmin sticky: never
        // demote on update, never promote here unless the email
        // domain qualifies. seed-admin.ts handles fine-grained
        // promotion for cases the domain rule misses.
        await User.findOneAndUpdate(
          { clerkId: id },
          {
            $set: {
              clerkId: id,
              email: primaryEmail,
              firstName: first_name || '',
              lastName: last_name || '',
              username: username || '',
              profileImageUrl: image_url || '',
              publicMetadata: (public_metadata as Record<string, unknown>) || {},
            },
            $setOnInsert: {
              isAdmin: adminByDomain,
              createdAt: new Date(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        // On user.created, mirror isAdmin into Clerk publicMetadata
        // so client navbars / AdminProtectedRoute can read the flag
        // without hitting /api/users/me first.
        if (evt.type === 'user.created') {
          try {
            const client = await clerkClient();
            await client.users.updateUser(id, {
              publicMetadata: {
                isAdmin: adminByDomain,
                status: 'active',
              },
            });
          } catch (clerkErr) {
            console.warn('[clerk-webhook] updateUser failed (non-fatal)', clerkErr);
          }
        }
        break;
      }

      case 'user.deleted': {
        const { id, deleted } = evt.data as { id: string; deleted?: boolean };
        if (deleted) {
          await User.deleteOne({ clerkId: id });
        }
        break;
      }

      default:
        // Other event types (session.*, organization.*, etc.) acked
        // without action.
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[clerk-webhook] handler error:', error);
    return errorResponse('Webhook handler failed', 500);
  }
}

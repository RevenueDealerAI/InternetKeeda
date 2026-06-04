import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';

/**
 * Server-component gate for /store/admin/*. Use as a sibling of the
 * page's content so admin enforcement always runs before any client
 * code renders.
 *
 *   const guard = await requireStoreAdmin();
 *   if (guard !== 'ok') return null; // requireStoreAdmin already redirected
 */
export async function requireStoreAdmin(): Promise<'ok'> {
  const a = await requireAdmin();
  if (a.kind === 'unauthenticated') redirect('/sign-in?redirect_url=/store/admin');
  if (a.kind === 'not-admin') redirect('/');
  return 'ok';
}

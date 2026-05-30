import { redirect } from 'next/navigation';

// Canonical refund policy lives at /refund (singular). The legacy
// /refunds route is preserved as a redirect so any existing links
// (footer of older deploys, external citations) keep working.
export default function RefundsRedirect() {
  redirect('/refund');
}

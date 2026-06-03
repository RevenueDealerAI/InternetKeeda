'use client';

/**
 * Primary customer-support contact channel. The deep link
 * `https://wa.me/internetkeeda` is the same one already in use in
 * Footer.tsx, AgentSection.tsx, the AI search route's system
 * prompt, and the KeedaChat link allowlist — keep them all in
 * sync if the WA number ever changes.
 *
 * Two sizes:
 *   - "md" (default) — matches the footer's pill button
 *   - "sm"           — for inline use inside legal-page paragraphs
 */

const WA_HREF = 'https://wa.me/internetkeeda';

export function WhatsAppSupportButton({
  label = 'Connect on WhatsApp',
  size = 'md',
}: {
  label?: string;
  size?: 'sm' | 'md';
}) {
  const padding = size === 'sm' ? '6px 14px' : '10px 18px';
  const fontSize = size === 'sm' ? 10 : 11;
  const iconSize = size === 'sm' ? 13 : 16;
  return (
    <a
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="inline-flex items-center gap-2 rounded-full transition-transform hover:-translate-y-0.5"
      style={{
        background: '#25D366',
        color: '#fff',
        padding,
        fontFamily: 'var(--mono)',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        boxShadow: '0 8px 24px -8px rgba(37, 211, 102, 0.55)',
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill="currentColor"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004A9.87 9.87 0 016.96 20.42l-.365-.218-3.78.99 1.01-3.68-.238-.378a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884a9.825 9.825 0 016.992 2.898 9.825 9.825 0 012.892 6.99c-.002 5.45-4.437 9.885-9.885 9.885zM20.52 3.449C18.24 1.245 15.24.044 12.045.044 5.46.044.103 5.398.1 11.987c0 2.096.547 4.142 1.588 5.945L0 24l6.215-1.63a11.943 11.943 0 005.83 1.485h.005c6.585 0 11.945-5.354 11.948-11.943 0-3.192-1.245-6.196-3.475-8.463z" />
      </svg>
      {label}
    </a>
  );
}

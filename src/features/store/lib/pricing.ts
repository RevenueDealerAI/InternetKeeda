import type { StoreCurrency } from '../config';

/**
 * Pricing display + minor-unit conversion helpers for the store.
 *
 * Minor units everywhere (cents for USD, paise for INR) — same
 * convention the boost flow uses. Conversion only happens at the
 * UI boundary (`formatPrice`) and at the PSP boundary (`toMajor`).
 */

export function toMajor(amountMinor: number): number {
  return Math.round(amountMinor) / 100;
}

export function fromMajor(amountMajor: number, currency: StoreCurrency): number {
  // Round at the minor unit so floats don't drift across the boundary.
  return Math.round(amountMajor * 100);
}

const FORMATTERS: Record<StoreCurrency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }),
  INR: new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }),
};

export function formatPrice(
  amountMinor: number,
  currency: StoreCurrency
): string {
  return FORMATTERS[currency].format(toMajor(amountMinor));
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '—';
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(1)} KB`;
  return `${bytes} B`;
}

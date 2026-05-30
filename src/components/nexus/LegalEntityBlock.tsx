'use client';

// Compact entity block. Used at the bottom of every legal page so
// the customer can see both merchants-of-record with addresses in
// the same place, instead of skimming for them.

import { LEGAL_ENTITIES } from '@/lib/brand';

export function LegalEntityBlock({
  includeUK = false,
}: {
  includeUK?: boolean;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Entity
        label={`Merchant of record · ${LEGAL_ENTITIES.inr.gateway}`}
        name={LEGAL_ENTITIES.inr.name}
        addressLines={LEGAL_ENTITIES.inr.addressLines}
      />
      <Entity
        label={`Merchant of record · ${LEGAL_ENTITIES.usd.gateway}`}
        name={LEGAL_ENTITIES.usd.name}
        addressLines={LEGAL_ENTITIES.usd.addressLines}
      />
      {includeUK && (
        <Entity
          label="UK corporate reference"
          name={LEGAL_ENTITIES.uk.name}
          addressLines={LEGAL_ENTITIES.uk.addressLines}
        />
      )}
    </div>
  );
}

function Entity({
  label,
  name,
  addressLines,
}: {
  label: string;
  name: string;
  addressLines: readonly string[];
}) {
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
      }}
    >
      <div
        className="text-[10px] uppercase tracking-[0.22em]"
        style={{
          fontFamily: 'var(--mono)',
          color: 'var(--ink-soft)',
        }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-[14px] font-medium"
        style={{ color: 'var(--ink)' }}
      >
        {name}
      </div>
      <div
        className="mt-1 text-[13px] leading-[1.55]"
        style={{ color: 'var(--ink-2)' }}
      >
        {addressLines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}

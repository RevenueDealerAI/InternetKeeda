'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { STORE_BRAND } from '../../config';
import { formatFileSize } from '../../lib/pricing';

interface InitialValues {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: 'n8n-workflow' | 'automation-pack' | 'template' | 'guide' | 'other';
  tags: string[];
  includes: string[];
  coverImageUrl: string;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  priceUsdMinor: number;
  priceInrMinor: number;
  status: 'draft' | 'published' | 'archived';
}

export default function AdminProductForm({
  initial,
  mode,
}: {
  initial: InitialValues;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [v, setV] = useState<InitialValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<'file' | 'cover' | null>(
    null
  );

  function set<K extends keyof InitialValues>(k: K, val: InitialValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function handleUpload(kind: 'file' | 'cover', file: File) {
    setUploadingKind(kind);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('file', file);
      const res = await fetch('/api/store/admin/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Upload failed');
        return;
      }
      if (kind === 'cover') {
        set('coverImageUrl', data.data.url);
      } else {
        set('filePath', data.data.url);
        set('fileName', data.data.fileName);
        set('fileSizeBytes', data.data.sizeBytes);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingKind(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = {
        title: v.title,
        slug: v.slug,
        description: v.description,
        shortDescription: v.shortDescription,
        category: v.category,
        tags: v.tags,
        includes: v.includes,
        coverImageUrl: v.coverImageUrl,
        previewImages: [],
        filePath: v.filePath,
        fileName: v.fileName,
        fileSizeBytes: v.fileSizeBytes,
        priceUsdMinor: v.priceUsdMinor,
        priceInrMinor: v.priceInrMinor,
        status: v.status,
      };
      const url =
        mode === 'edit'
          ? `/api/store/admin/products/${v._id}`
          : '/api/store/admin/products';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Save failed');
        return;
      }
      router.push('/store/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[760px] px-7 pt-[140px] pb-24">
        <div
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
        >
          § {STORE_BRAND.name.toLowerCase()} · admin
        </div>
        <h1
          className="m-0 mt-3"
          style={{
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            fontSize: 36,
            fontWeight: 500,
            letterSpacing: '-0.03em',
          }}
        >
          {mode === 'edit' ? 'Edit product' : 'New product'}
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          <Field label="Title">
            <input
              required
              value={v.title}
              onChange={(e) => set('title', e.target.value)}
              {...textInputProps}
            />
          </Field>
          <Field
            label="Slug"
            hint="lowercase, hyphenated. Lives at /store/{slug}"
          >
            <input
              required
              value={v.slug}
              onChange={(e) =>
                set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
              }
              {...textInputProps}
            />
          </Field>
          <Field label="Short description (for cards)">
            <textarea
              rows={2}
              value={v.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
              {...textInputProps}
            />
          </Field>
          <Field label="Full description">
            <textarea
              rows={6}
              required
              value={v.description}
              onChange={(e) => set('description', e.target.value)}
              {...textInputProps}
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Category">
              <select
                value={v.category}
                onChange={(e) =>
                  set('category', e.target.value as InitialValues['category'])
                }
                {...textInputProps}
              >
                <option value="n8n-workflow">n8n workflow</option>
                <option value="automation-pack">automation pack</option>
                <option value="template">template</option>
                <option value="guide">guide</option>
                <option value="other">other</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={v.status}
                onChange={(e) =>
                  set('status', e.target.value as InitialValues['status'])
                }
                {...textInputProps}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </Field>
          </div>

          <Field
            label="What's included (one per line)"
            hint="Bulleted list shown on the product detail page"
          >
            <textarea
              rows={4}
              value={v.includes.join('\n')}
              onChange={(e) =>
                set(
                  'includes',
                  e.target.value
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean)
                )
              }
              {...textInputProps}
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              value={v.tags.join(', ')}
              onChange={(e) =>
                set(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
              {...textInputProps}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Price (USD)" hint="In dollars, e.g. 19.99">
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={(v.priceUsdMinor / 100).toString()}
                onChange={(e) =>
                  set(
                    'priceUsdMinor',
                    Math.round(parseFloat(e.target.value || '0') * 100)
                  )
                }
                {...textInputProps}
              />
            </Field>
            <Field label="Price (INR)" hint="In rupees, e.g. 1499">
              <input
                type="number"
                step="1"
                min={0}
                required
                value={(v.priceInrMinor / 100).toString()}
                onChange={(e) =>
                  set(
                    'priceInrMinor',
                    Math.round(parseFloat(e.target.value || '0') * 100)
                  )
                }
                {...textInputProps}
              />
            </Field>
          </div>

          <UploadPanel
            label="Cover image (public)"
            currentUrl={v.coverImageUrl}
            sizeBytes={0}
            uploading={uploadingKind === 'cover'}
            accept="image/*"
            onPick={(f) => handleUpload('cover', f)}
          />

          <UploadPanel
            label="Downloadable file (private)"
            currentUrl={v.filePath}
            fileName={v.fileName}
            sizeBytes={v.fileSizeBytes}
            uploading={uploadingKind === 'file'}
            accept="*/*"
            onPick={(f) => handleUpload('file', f)}
          />

          {error && (
            <div
              className="rounded-xl p-3 text-[13px]"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[12px] uppercase tracking-[0.16em] font-semibold disabled:opacity-60"
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontFamily: 'var(--mono)',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create product'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/store/admin')}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[12px] uppercase tracking-[0.16em]"
              style={{
                background: 'transparent',
                color: 'var(--ink-2)',
                border: '1px solid var(--rule)',
                fontFamily: 'var(--mono)',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const textInputProps = {
  className:
    'w-full rounded-xl px-4 py-3 text-[14px] outline-none transition-colors',
  style: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--rule)',
    fontFamily: 'var(--sans)',
  } as React.CSSProperties,
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span
        className="text-[10px] uppercase tracking-[0.22em]"
        style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function UploadPanel({
  label,
  currentUrl,
  fileName,
  sizeBytes,
  uploading,
  accept,
  onPick,
}: {
  label: string;
  currentUrl: string;
  fileName?: string;
  sizeBytes: number;
  uploading: boolean;
  accept: string;
  onPick: (f: File) => void;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
      }}
    >
      <div
        className="text-[10px] uppercase tracking-[0.22em]"
        style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
      >
        {label}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.16em] font-semibold"
          style={{
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--rule)',
            fontFamily: 'var(--mono)',
          }}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : currentUrl ? 'Replace' : 'Upload'}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = '';
            }}
          />
        </label>
        {currentUrl ? (
          <div className="min-w-0 flex-1 text-[12.5px]">
            <div
              className="truncate"
              style={{ color: 'var(--ink), fontFamily: var(--mono)' }}
            >
              {fileName || currentUrl.split('/').pop()}
            </div>
            {sizeBytes > 0 && (
              <div
                className="text-[11px]"
                style={{ color: 'var(--ink-soft)' }}
              >
                {formatFileSize(sizeBytes)}
              </div>
            )}
          </div>
        ) : (
          <span
            className="text-[12px]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            Nothing uploaded yet.
          </span>
        )}
      </div>
    </div>
  );
}

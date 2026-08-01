import mongoose, { Document, Model } from 'mongoose';

/**
 * Fixed-window rate-limit counter. One document per (key, windowStart).
 *
 * - `key`        identity + scope, e.g. `chat:user:<id>`, `chat:ip:<ip>`,
 *                `chat:global:day` (minute vs day is distinguished by the
 *                windowStart granularity, not by the key).
 * - `windowStart`the aligned start of the window this bucket counts.
 * - `count`      atomically incremented via $inc (never read-then-write).
 * - `expiresAt`  TTL anchor. A background Mongo job deletes the doc once
 *                expiresAt < now, so old windows self-clean — the
 *                collection never grows unbounded.
 *
 * The compound {key, windowStart} unique index guarantees a single
 * bucket per window even under a race: two concurrent upserts collide on
 * the index and both resolve to $inc on the same document.
 */
export interface IRateLimitBucket {
  key: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
}

export type RateLimitBucketDocument = Document & IRateLimitBucket;

const rateLimitBucketSchema = new mongoose.Schema<IRateLimitBucket>(
  {
    key: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// One bucket per (key, window). Unique so concurrent upserts converge.
rateLimitBucketSchema.index({ key: 1, windowStart: 1 }, { unique: true });
// TTL: delete the doc when expiresAt passes. expireAfterSeconds:0 means
// "expire exactly at expiresAt".
rateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Supports the admin stats aggregation (recent buckets by window).
rateLimitBucketSchema.index({ windowStart: 1 });

export const RateLimitBucket = (mongoose.models.RateLimitBucket ||
  mongoose.model('RateLimitBucket', rateLimitBucketSchema)) as unknown as Model<RateLimitBucketDocument>;

import mongoose, { Document, Model } from 'mongoose';

/**
 * Cached AI tool-search results. A cache HIT returns the stored payload
 * with zero Anthropic spend (and without consuming rate-limit quota).
 *
 * - `key`       sha256 of `${CACHE_VERSION}:${scope}:${normalizedQuery}`
 *               (unique). Bumping CACHE_VERSION busts every entry.
 * - `payload`   the exact JSON response to replay.
 * - `expiresAt` TTL anchor (search 7d, chat 24h) — a background Mongo
 *               job deletes expired entries.
 */
export interface IAiQueryCache {
  key: string;
  scope: 'chat' | 'search';
  payload: unknown;
  createdAt: Date;
  expiresAt: Date;
}

export type AiQueryCacheDocument = Document & IAiQueryCache;

const aiQueryCacheSchema = new mongoose.Schema<IAiQueryCache>(
  {
    key: { type: String, required: true, unique: true },
    scope: { type: String, enum: ['chat', 'search'], required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

aiQueryCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
aiQueryCacheSchema.index({ scope: 1 });

export const AiQueryCache = (mongoose.models.AiQueryCache ||
  mongoose.model('AiQueryCache', aiQueryCacheSchema)) as unknown as Model<AiQueryCacheDocument>;

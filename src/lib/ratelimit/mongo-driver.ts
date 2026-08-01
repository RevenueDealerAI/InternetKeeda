import { connectDB } from '@/app/api/lib/db';
import { RateLimitBucket } from '@/models/RateLimitBucket';

/**
 * A rate-limit storage driver. The rest of the system talks only to this
 * interface, so a different backend (e.g. Upstash Redis) can be dropped
 * in later without touching callers — implement `increment` and swap the
 * export in ./index.ts. (Not added now; no new dependency.)
 */
export interface RateLimitDriver {
  /**
   * Atomically add 1 to the (key, windowStart) counter and return the
   * NEW value. Must be a single atomic op — never read-then-write.
   */
  increment(opts: {
    key: string;
    windowStart: Date;
    windowSec: number;
  }): Promise<number>;

  /** Read the current count without incrementing (0 if absent). */
  peek(opts: { key: string; windowStart: Date }): Promise<number>;

  /** Atomically add `amount` to the counter (for token accumulation). */
  incrementBy(opts: {
    key: string;
    windowStart: Date;
    windowSec: number;
    amount: number;
  }): Promise<number>;
}

/** Small grace so a bucket survives its whole window before the TTL job
 *  can reap it, even with clock skew / coarse TTL granularity. */
const TTL_GRACE_SEC = 120;

export const mongoDriver: RateLimitDriver = {
  async increment({ key, windowStart, windowSec }) {
    await connectDB();
    const expiresAt = new Date(
      windowStart.getTime() + (windowSec + TTL_GRACE_SEC) * 1000,
    );
    // Single atomic upsert+increment. $setOnInsert seeds expiresAt only
    // on the first write of the window; concurrent callers collide on the
    // unique {key, windowStart} index and all resolve to $inc — no lost
    // update, no read-then-write, no transaction.
    const doc = await RateLimitBucket.findOneAndUpdate(
      { key, windowStart },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true },
    )
      .lean()
      .exec();
    return (doc as { count: number }).count;
  },

  async peek({ key, windowStart }) {
    await connectDB();
    const doc = await RateLimitBucket.findOne({ key, windowStart })
      .select('count')
      .lean()
      .exec();
    return (doc as { count?: number } | null)?.count ?? 0;
  },

  async incrementBy({ key, windowStart, windowSec, amount }) {
    await connectDB();
    const expiresAt = new Date(
      windowStart.getTime() + (windowSec + TTL_GRACE_SEC) * 1000,
    );
    const doc = await RateLimitBucket.findOneAndUpdate(
      { key, windowStart },
      { $inc: { count: amount }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true },
    )
      .lean()
      .exec();
    return (doc as { count: number }).count;
  },
};

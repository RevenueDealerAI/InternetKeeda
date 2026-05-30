/**
 * Diagnostic — checks the actual MongoDB state and the model-level
 * persistence path for tool soft-delete. Read-only by default; pass
 * --simulate-delete <id> to dry-run a delete against a specific tool.
 *
 *   npx tsx --env-file=.env.local scripts/diagnose-deleted-tools.ts
 *   npx tsx --env-file=.env.local scripts/diagnose-deleted-tools.ts \
 *     --simulate-delete 6a13e4f802d0b229f3631560
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Tool } from "../src/app/api/models/Tool";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("no db handle");

  // Show current state for the screenshot tools.
  const names = [/sample tolls?/i, /^test$/i, /^test /i];
  const docs = await db
    .collection("tools")
    .find(
      { $or: names.map((re) => ({ name: { $regex: re } })) },
      {
        projection: {
          _id: 1,
          name: 1,
          slug: 1,
          status: 1,
          listingStatus: 1,
          deletedAt: 1,
          updatedAt: 1,
        },
      },
    )
    .sort({ updatedAt: -1 })
    .limit(20)
    .toArray();
  console.log("--- screenshot candidates ---");
  console.log(JSON.stringify({ matched: docs.length, docs }, null, 2));

  // Most recently soft-deleted tools — proves the delete code path
  // works in production. Anything here means the wiring is OK; the
  // user-reported issue is elsewhere (cache, wrong button, etc.).
  const recentDeleted = await db
    .collection("tools")
    .find(
      { deletedAt: { $ne: null } },
      {
        projection: { _id: 1, name: 1, listingStatus: 1, deletedAt: 1 },
      },
    )
    .sort({ deletedAt: -1 })
    .limit(5)
    .toArray();
  console.log("--- most-recently soft-deleted ---");
  console.log(JSON.stringify({ recentDeleted }, null, 2));

  // Optional: simulate exactly what /api/admin/tools/[id] DELETE does
  // (minus the Cashfree subscription cancellation) — flips deletedAt
  // and listingStatus, then re-reads to confirm persistence.
  const idx = process.argv.indexOf("--simulate-delete");
  if (idx !== -1) {
    const targetId = process.argv[idx + 1];
    if (!targetId) {
      console.error("--simulate-delete requires an id");
      process.exit(1);
    }
    console.log("--- simulating delete against", targetId, "---");
    const tool = await Tool.findById(targetId);
    if (!tool) {
      console.log("Tool not found.");
    } else if (tool.deletedAt) {
      console.log("Already soft-deleted:", tool.deletedAt);
    } else {
      const beforeStatus = tool.listingStatus;
      tool.deletedAt = new Date();
      tool.listingStatus = "unpaid-hidden";
      await tool.save();
      const reread = await Tool.findById(targetId);
      console.log(
        JSON.stringify(
          {
            before: { listingStatus: beforeStatus, deletedAt: null },
            after: {
              listingStatus: reread?.listingStatus,
              deletedAt: reread?.deletedAt,
            },
            persisted: !!reread?.deletedAt,
          },
          null,
          2,
        ),
      );
      // Restore immediately — this is a diagnostic, not a real delete.
      if (reread) {
        reread.deletedAt = undefined;
        reread.listingStatus = beforeStatus;
        await reread.save();
        console.log("Restored — diagnostic was non-destructive.");
      }
    }
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

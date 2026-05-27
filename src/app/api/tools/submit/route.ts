import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Category } from "@/app/api/models/Category";

const submitSchema = z.object({
  name: z.string().min(2).max(120),
  websiteUrl: z.string().url(),
  description: z.string().min(20).max(2000),
  category: z.string().min(2).max(80),
  logo: z.string().url().optional(),
});

async function validateCategorySlug(
  slug: string,
): Promise<{ name: string | null; error?: string }> {
  // Tool.category is stored as the canonical NAME (e.g. "Image
  // Generation"), not the slug. That matches the seed convention
  // used by the 5,000 imported tools and the category page's
  // client-side filter. We accept the slug from the form, validate
  // it exists, and return the name for storage.
  const cat = await Category.findOne({ slug, isActive: { $ne: false } })
    .select("name slug")
    .lean();
  if (!cat) {
    return {
      name: null,
      error: `Category "${slug}" is not a valid category. Pick from the dropdown.`,
    };
  }
  return { name: cat.name };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * POST /api/tools/submit
 *
 * Phase B minimum: lets a signed-in user submit a tool. The tool is
 * created with ownerUserId = auth.userId, seededTool:false, and
 * listingStatus:'unpaid-pending'. The user can immediately boost it
 * from the dashboard. Phase C expands this flow to also start a
 * Cashfree subscription ($10/mo) before the tool publishes.
 *
 * Cooldown guard: when the same submitter has had a tool rejected
 * with matching name OR websiteUrl in the last 48 hours, returns 429
 * with `canResubmitAt` so the client can show a friendly countdown
 * banner. Per-tool, not per-user — submitting a *different* tool
 * after a rejection is fine.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const body = await req.json();
    const data = submitSchema.parse(body);

    const cooldownCutoff = new Date(Date.now() - FORTY_EIGHT_HOURS_MS);
    const recentRejection = await Tool.findOne({
      ownerUserId: auth.userId,
      status: "rejected",
      rejectedAt: { $gte: cooldownCutoff },
      $or: [{ name: data.name }, { websiteUrl: data.websiteUrl }],
    })
      .select("name websiteUrl rejectedAt")
      .lean();

    if (recentRejection?.rejectedAt) {
      const canResubmitAt = new Date(
        recentRejection.rejectedAt.getTime() + FORTY_EIGHT_HOURS_MS,
      );
      const hoursLeft = Math.max(
        1,
        Math.ceil((canResubmitAt.getTime() - Date.now()) / (60 * 60 * 1000)),
      );
      return NextResponse.json(
        {
          error: "Recently rejected",
          message: `A tool with the same name or website was rejected less than 48 hours ago. You can resubmit in ~${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`,
          canResubmitAt: canResubmitAt.toISOString(),
          hoursLeft,
        },
        { status: 429 },
      );
    }

    const cat = await validateCategorySlug(data.category);
    if (!cat.name) {
      return NextResponse.json({ error: cat.error }, { status: 400 });
    }

    // Resolve slug collisions by suffixing.
    const base = slugify(data.name);
    let slug = base;
    let n = 1;
    while (await Tool.exists({ slug })) {
      slug = `${base}-${++n}`;
      if (n > 50) {
        return NextResponse.json(
          { error: "Could not generate a unique slug. Try a different name." },
          { status: 409 },
        );
      }
    }

    const tool = await Tool.create({
      name: data.name,
      slug,
      description: data.description,
      websiteUrl: data.websiteUrl,
      category: cat.name,
      tags: [],
      pricing: { type: "freemium" },
      features: [],
      logo: data.logo,
      status: "pending",
      ownerUserId: auth.userId,
      seededTool: false,
      listingStatus: "unpaid-pending",
      activeBoosts: [],
    });

    return NextResponse.json({
      id: String(tool._id),
      slug: tool.slug,
      listingStatus: tool.listingStatus,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("tools/submit error:", err);
    return errorResponse("Failed to submit tool", 500);
  }
}

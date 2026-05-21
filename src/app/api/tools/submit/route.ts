import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";

const submitSchema = z.object({
  name: z.string().min(2).max(120),
  websiteUrl: z.string().url(),
  description: z.string().min(20).max(2000),
  category: z.string().min(2).max(80),
  logo: z.string().url().optional(),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * POST /api/tools/submit
 *
 * Phase B minimum: lets a signed-in user submit a tool. The tool is
 * created with ownerUserId = auth.userId, seededTool:false, and
 * listingStatus:'unpaid-pending'. The user can immediately boost it
 * from the dashboard. Phase C expands this flow to also start a
 * Cashfree subscription (₹499/mo) before the tool publishes.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const body = await req.json();
    const data = submitSchema.parse(body);

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
      category: data.category,
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

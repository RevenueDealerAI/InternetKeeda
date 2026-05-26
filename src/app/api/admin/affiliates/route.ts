import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "../../lib/db";
import { AffiliateProfile } from "../../models/AffiliateProfile";
import { User } from "../../models/User";

export async function GET(_req: NextRequest) {
    try {
        const a = await requireAdmin();
        if (a.kind !== "ok") {
            return NextResponse.json(
                { error: a.kind },
                { status: a.kind === "unauthenticated" ? 401 : 403 },
            );
        }

        await connectDB();

        const affiliates = await AffiliateProfile.find().sort({ createdAt: -1 });

        const enriched = await Promise.all(affiliates.map(async (aff) => {
            const u = await User.findOne({ clerkId: aff.userId }).select('firstName lastName email profileImageUrl');
            return {
                ...aff.toObject(),
                user: u
            };
        }));

        return NextResponse.json(enriched);

    } catch (error) {
        console.error("Admin Affiliates Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

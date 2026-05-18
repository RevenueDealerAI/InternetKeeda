import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "../../lib/db";
import { AffiliateProfile } from "../../models/AffiliateProfile";
import { Commission } from "../../models/Commission";
import { User } from "../../models/User";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        const profile = await AffiliateProfile.findOne({ userId });

        if (!profile) {
            return NextResponse.json({ isAffiliate: false });
        }

        const referralCount = await User.countDocuments({ referredBy: profile.uniqueCode });

        // Fetch recent commissions
        const recentCommissions = await Commission.find({ affiliateId: userId })
            .sort({ createdAt: -1 })
            .limit(10);

        return NextResponse.json({
            isAffiliate: true,
            profile,
            referralCount,
            recentCommissions
        });

    } catch (error) {
        console.error("Affiliate Stats Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

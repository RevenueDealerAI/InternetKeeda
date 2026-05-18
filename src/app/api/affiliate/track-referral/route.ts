import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "../../lib/db";
import { User } from "../../models/User";
import { AffiliateProfile } from "../../models/AffiliateProfile";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth(); // Clerk ID
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ error: "No code provided" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ clerkId: userId });

        // If user record doesn't exist yet, we can't set referredBy.
        // However, usually Clerk webhook runs fast. 
        // If it's missing, we might want to create it or just return 404.
        if (!user) {
            return NextResponse.json({ error: "User not synced yet" }, { status: 404 });
        }

        // Only set if not already set
        if (!user.referredBy) {
            // Validation: Check if code is valid
            const affiliate = await AffiliateProfile.findOne({ uniqueCode: code });

            // Prevent self-referral
            if (affiliate && affiliate.userId !== userId) {
                user.referredBy = code;
                await user.save();
                return NextResponse.json({ success: true, message: "Referral applied" });
            } else {
                return NextResponse.json({ error: "Invalid affiliate code or self-referral" }, { status: 400 });
            }
        }

        return NextResponse.json({ success: true, message: "Already referred" });

    } catch (error) {
        console.error("Track Referral Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

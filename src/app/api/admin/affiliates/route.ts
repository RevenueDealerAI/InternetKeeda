import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "../../lib/db";
import { AffiliateProfile } from "../../models/AffiliateProfile";
import { User } from "../../models/User";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        // Check Admin Role
        const isAdmin = clerkUser.publicMetadata?.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

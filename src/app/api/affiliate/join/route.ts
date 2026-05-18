import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "../../lib/db";
import { AffiliateProfile } from "../../models/AffiliateProfile";
import { User } from "../../models/User";

function generateCode(username: string | null) {
    const base = username ? username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'user';
    const random = Math.floor(Math.random() * 10000);
    return `${base}${random}`;
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        const existingProfile = await AffiliateProfile.findOne({ userId });
        if (existingProfile) {
            return NextResponse.json({ success: true, message: "Already an affiliate" });
        }

        // Generate unique code
        let uniqueCode = user.username || `user${userId.slice(-5)}`;

        // Ensure uniqueness
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
            const check = await AffiliateProfile.findOne({ uniqueCode });
            if (!check) {
                isUnique = true;
            } else {
                uniqueCode = generateCode(user.username);
            }
            attempts++;
        }

        const newProfile = await AffiliateProfile.create({
            userId,
            uniqueCode,
            status: 'active',
            totalEarnings: 0,
            unpaidBalance: 0
        });

        return NextResponse.json({ success: true, profile: newProfile });

    } catch (error) {
        console.error("Join Affiliate Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

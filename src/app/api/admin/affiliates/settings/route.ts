import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/app/api/lib/db";
import { AffiliateSettings } from "@/models/AffiliateSettings";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const isAdmin = clerkUser.publicMetadata?.role === 'admin';
        if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await connectDB();
        const settings = await AffiliateSettings.getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const isAdmin = clerkUser.publicMetadata?.role === 'admin';
        if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const { commissionRate, minimumPayout, cookieDurationDays, termsAndConditions } = body;

        await connectDB();
        const settings = await AffiliateSettings.getSettings();

        // Update fields
        if (commissionRate !== undefined) settings.commissionRate = commissionRate;
        if (minimumPayout !== undefined) settings.minimumPayout = minimumPayout;
        if (cookieDurationDays !== undefined) settings.cookieDurationDays = cookieDurationDays;
        if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;

        settings.updatedBy = userId;
        await settings.save();

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Update Settings Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

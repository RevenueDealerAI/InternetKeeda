import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/app/api/lib/db";
import { AffiliateSettings } from "@/models/AffiliateSettings";

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
        const settings = await AffiliateSettings.getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const a = await requireAdmin();
        if (a.kind !== "ok") {
            return NextResponse.json(
                { error: a.kind },
                { status: a.kind === "unauthenticated" ? 401 : 403 },
            );
        }
        const userId = a.userId;

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

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/app/api/lib/db"; // Updated path
import { AffiliateProfile } from "@/app/api/models/AffiliateProfile"; // Updated path, verified?
import { Commission } from "@/app/api/models/Commission"; // Updated path

export async function POST(req: NextRequest) {
    try {
        const a = await requireAdmin();
        if (a.kind !== "ok") {
            return NextResponse.json(
                { error: a.kind },
                { status: a.kind === "unauthenticated" ? 401 : 403 },
            );
        }
        const userId = a.userId;

        const { affiliateProfileId, amount, type, description } = await req.json();

        if (!affiliateProfileId || !amount || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        const affiliate = await AffiliateProfile.findById(affiliateProfileId);
        if (!affiliate) {
            return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
        }

        // Create Commission/Adjustment Record
        await Commission.create({
            affiliateId: affiliate.userId,
            amount: amount, // Can be negative
            status: 'approved', // Auto-approve manual adjustments
            type: type, // 'bonus' or 'adjustment'
            description: description || 'Manual adjustment by admin',
            sourceId: `admin-${userId}-${Date.now()}`
        });

        // Update Affiliate Balance
        // If amount is positive (Bonus) -> Increases Earnings and Unpaid Balance
        // If amount is negative (Penalty) -> Decreases Earnings and Unpaid Balance
        // But what if we just want to PAY them? That's a Payout.
        // Balance Adjustment usually affects "Earnings" logic.

        affiliate.unpaidBalance = Math.max(0, affiliate.unpaidBalance + amount);

        // Only add to totalEarnings if it's a positive gain (Bonus). 
        // If it's a correction (negative), we remove from earnings.
        // If we really want to separate "Gross Earnings" vs "Net", we might need more logic, 
        // but for now adjusting total match makes sense for corrections.
        affiliate.totalEarnings = Math.max(0, affiliate.totalEarnings + amount);

        await affiliate.save();

        return NextResponse.json({ success: true, newBalance: affiliate.unpaidBalance });

    } catch (error) {
        console.error("Adjustment Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

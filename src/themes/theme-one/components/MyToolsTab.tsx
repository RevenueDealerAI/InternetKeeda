"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Plus } from "lucide-react";
import { BoostModal } from "./BoostModal";
import { useQuery } from "@tanstack/react-query";

interface MyTool {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  category: string;
  status: string;
  listingStatus: string;
  activeBoosts: Array<"category-top" | "home-rotation" | "featured-badge">;
  boostExpiresAt: Partial<Record<string, string>>;
  createdAt: string;
}

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  "free-seeded": { label: "Free Seeded", className: "bg-emerald-50 text-emerald-700 ring-emerald-200/60" },
  "paid-active": { label: "Live", className: "bg-emerald-50 text-emerald-700 ring-emerald-200/60" },
  "paid-expired": { label: "Expired", className: "bg-amber-50 text-amber-700 ring-amber-200/60" },
  "unpaid-pending": { label: "Awaiting Payment", className: "bg-orange-50 text-orange-700 ring-orange-200/60" },
  "unpaid-hidden": { label: "Hidden", className: "bg-red-50 text-red-700 ring-red-200/60" },
};

export function MyToolsTab() {
  const [boostTarget, setBoostTarget] = useState<MyTool | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-tools"],
    queryFn: async (): Promise<{ tools: MyTool[] }> => {
      const r = await fetch("/api/tools/mine", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch your tools");
      return r.json();
    },
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-10 text-center">Loading your tools…</div>;
  }
  if (error) {
    return (
      <div className="text-sm text-red-600 py-10 text-center">
        {error instanceof Error ? error.message : "Failed to load"}
      </div>
    );
  }
  const tools = data?.tools ?? [];

  if (tools.length === 0) {
    return (
      <div className="text-center bg-white border border-dashed border-gray-300 rounded-2xl py-16 px-6">
        <h3 className="text-lg font-semibold text-gray-900">You haven&apos;t submitted any tools yet</h3>
        <p className="mt-2 text-sm text-gray-600">Listings show up here once you submit one.</p>
        <div className="mt-5">
          <Link href="/submit-tool">
            <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <Plus className="w-4 h-4 mr-1" />
              Submit a tool
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">My Tools</h2>
        <Link href="/submit-tool">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Submit another
          </Button>
        </Link>
      </div>

      <div className="grid gap-3">
        {tools.map((t) => {
          const statusMeta = STATUS_BADGE[t.listingStatus] || {
            label: t.listingStatus,
            className: "bg-gray-100 text-gray-700 ring-gray-200/60",
          };
          return (
            <div
              key={t.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-gray-50 ring-1 ring-gray-200/80">
                {t.logo ? (
                  <Image src={t.logo} alt={t.name} fill sizes="48px" className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-orange-500 font-bold">
                    {t.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{t.name}</h3>
                  <Badge className={`ring-1 ${statusMeta.className}`}>{statusMeta.label}</Badge>
                  {t.activeBoosts.map((b) => (
                    <Badge key={b} className="bg-gradient-to-r from-orange-500 to-red-600 text-white ring-0">
                      {b.replace(/-/g, " ")}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 truncate">{t.category}</p>
              </div>
              <Button
                size="sm"
                onClick={() => setBoostTarget(t)}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
              >
                <Rocket className="w-4 h-4 mr-1" /> Boost
              </Button>
            </div>
          );
        })}
      </div>

      {boostTarget && (
        <BoostModal
          open={!!boostTarget}
          onOpenChange={(o) => !o && setBoostTarget(null)}
          toolId={boostTarget.id}
          toolName={boostTarget.name}
        />
      )}
    </div>
  );
}

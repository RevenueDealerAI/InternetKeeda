import Link from "next/link";
import type { Metadata } from "next";
import {
  Star,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Advertise on InternetKeeda",
  description:
    "Reach 100k+ AI tool seekers — sponsored listings and homepage placements.",
  alternates: { canonical: "/advertise" },
};

// Server component. No client hooks, no Clerk, no DB. Exists to give
// the nav <Link href="/advertise"> a destination so Next.js stops
// prefetching a 404 on every page load. Real sponsored-listings sales
// page will be built out later.
export default function AdvertisePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAFAFA] to-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 ring-1 ring-orange-200/60 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            <Sparkles className="w-3 h-3" />
            Sponsored placements
          </span>
          <h1 className="mt-6 font-bold tracking-tight text-gray-900 leading-[1.05]" style={{ fontSize: "clamp(36px, 5vw, 64px)" }}>
            Advertise on{" "}
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              InternetKeeda
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed">
            Get your AI tool in front of thousands of buyers actively searching for solutions. Pay for visibility — not for clicks that never convert.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/submit-tool">
              <span className="inline-flex items-center h-11 px-5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(220,38,38,0.55)] hover:shadow-[0_12px_32px_-8px_rgba(220,38,38,0.6)] transition-shadow">
                Submit Your Tool
                <ArrowRight className="w-4 h-4 ml-2" />
              </span>
            </Link>
            <a href="mailto:hello@internetkeeda.com?subject=Custom%20advertising%20package">
              <span className="inline-flex items-center h-11 px-5 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                <Mail className="w-4 h-4 mr-2" />
                Email us for custom packages
              </span>
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Star className="w-5 h-5" />}
            title="Featured Listings"
            body="A red-gradient Featured badge on every card for 30 days, across the whole directory."
          />
          <FeatureCard
            icon={<LayoutGrid className="w-5 h-5" />}
            title="Category Sponsorship"
            body="Pin your tool to the #1 spot in its category page for 7 days. Buyers see you first."
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Homepage Spotlight"
            body="Join the home page featured rotation for 7 days — the highest-traffic surface on the site."
          />
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>
            Activate any of these from your{" "}
            <Link href="/dashboard" className="text-orange-600 hover:underline">
              dashboard
            </Link>{" "}
            once your tool is listed.
          </p>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white grid place-items-center">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

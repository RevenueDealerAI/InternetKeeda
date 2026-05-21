"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight } from "lucide-react";

/**
 * Phase B minimum tool submission. Phase C will replace the post-submit
 * redirect with a Cashfree subscription auth handoff so the listing
 * actually publishes.
 */
export default function SubmitToolPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  if (isLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen px-4 py-20 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)]">
          <h1 className="text-xl font-semibold text-gray-900">Sign in to submit a tool</h1>
          <p className="mt-2 text-sm text-gray-600">
            You need a free account to submit a tool to the directory.
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <Link href="/sign-in">
              <Button>Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="outline">Create account</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/tools/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, websiteUrl, description, category }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit");
      }
      toast({
        title: "Tool submitted",
        description: "Your tool is in review. Boost it from the dashboard to feature it.",
      });
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-16 bg-gradient-to-b from-[#FAFAFA] to-white">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)]">
        <h1 className="text-2xl font-bold text-gray-900">Submit your AI tool</h1>
        <p className="mt-1 text-sm text-gray-600">
          Listings go live after a quick review. Boost slots are available once it&apos;s published.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Tool name</Label>
            <Input id="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ScribbleAI" />
          </div>
          <div>
            <Label htmlFor="url">Website</Label>
            <Input id="url" required type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Writing, Image Generation, Productivity…" />
          </div>
          <div>
            <Label htmlFor="desc">Short description</Label>
            <Textarea id="desc" required minLength={20} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does it do? Who is it for?" rows={4} />
          </div>

          <div className="pt-2 flex items-center justify-end">
            <Button type="submit" disabled={busy} className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
              {busy ? "Submitting…" : (<>Submit <ArrowRight className="w-4 h-4 ml-1" /></>)}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

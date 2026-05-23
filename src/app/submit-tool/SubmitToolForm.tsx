"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

/**
 * Client form for /submit-tool. The page-level shell at page.tsx
 * does the server-side auth check + redirect — by the time this
 * component renders, the user is guaranteed signed in.
 */
export function SubmitToolForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    data: catData,
    isLoading: catLoading,
    error: catError,
    refetch: refetchCategories,
  } = useCategories();
  const categories = catData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast({ title: "Pick a category", variant: "destructive" });
      return;
    }
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
            {catError ? (
              <div className="mt-1 flex items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <span>Couldn&apos;t load categories.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => refetchCategories()}
                  className="border-red-200 text-red-700 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Select value={category} onValueChange={setCategory} disabled={catLoading}>
                <SelectTrigger id="category">
                  <SelectValue
                    placeholder={catLoading ? "Loading categories…" : "Pick a category"}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import mongoose from "mongoose"; // ObjectId.isValid (client-side guard)
import { useClerkSession } from "./useClerkSession";
import { API_BASE_URL } from "../config/constants";

/**
 * Tool action hook (upvote + save) — Clerk-free at the client level.
 * Previously this hook called useAuth + useUser from @clerk/clerk-react
 * and persisted the user's voted/saved lists into Clerk's `unsafeMetadata`
 * field. That pulled the Clerk SDK into every tool-listing page (home,
 * category, trending, etc.) on initial paint.
 *
 * The new model:
 *   - useClerkSession (cookie-based) tells us whether the visitor is
 *     signed in. No Clerk SDK required.
 *   - The per-device upvoted/saved lists live in localStorage. They
 *     follow the device, not the user. For a directory site this is
 *     acceptable trade — the cross-device "remember my votes" feature
 *     was nice-to-have, not load-bearing.
 *   - The global vote count is still incremented via the existing
 *     /api/tools/:id/vote endpoint. The server doesn't track per-user
 *     votes anyway (it only increments `tool.votes` on the doc).
 *   - Signed-out users CAN still upvote/save (locally). The previous
 *     behavior was to block them, but blocking just frustrates anon
 *     visitors and doesn't actually protect anything.
 */

interface ToolActions {
  upvotedTools: string[];
  savedTools: string[];
  isUpvoted: (dbToolId: string) => boolean;
  isSaved: (dbToolId: string) => boolean;
  toggleUpvote: (actualDbId: string, currentVoteCount: number) => Promise<void>;
  toggleSave: (dbToolId: string) => Promise<void>;
  isLoading: boolean;
}

const LS_UPVOTED = "ik_upvoted_tools";
const LS_SAVED = "ik_saved_tools";

function readLocal(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // quota exceeded or localStorage disabled — silently no-op
  }
}

export function useToolActions(): ToolActions {
  // Visibility-only signal. We don't gate any behavior on it currently,
  // but it's there in case we want to nudge anon users toward signing in.
  void useClerkSession();

  const [upvotedTools, setUpvotedTools] = useState<string[]>([]);
  const [savedTools, setSavedTools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUpvotedTools(readLocal(LS_UPVOTED));
    setSavedTools(readLocal(LS_SAVED));
  }, []);

  const isUpvoted = (dbToolId: string): boolean =>
    !!dbToolId && upvotedTools.includes(dbToolId);

  const isSaved = (dbToolId: string): boolean =>
    !!dbToolId && savedTools.includes(dbToolId);

  const toggleUpvote = async (actualDbId: string, _currentVoteCount: number) => {
    if (!actualDbId || actualDbId.startsWith("temp-") || !mongoose.Types.ObjectId.isValid(actualDbId)) {
      toast.error("This tool cannot be upvoted (invalid ID).");
      return;
    }

    setIsLoading(true);
    const alreadyUpvoted = upvotedTools.includes(actualDbId);
    const action = alreadyUpvoted ? "downvote" : "upvote";

    try {
      const response = await fetch(`${API_BASE_URL}/api/tools/${actualDbId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || typeof result.votes !== "number") {
        throw new Error(result.error || "Failed to update vote on server.");
      }

      const next = alreadyUpvoted
        ? upvotedTools.filter((id) => id !== actualDbId)
        : [...upvotedTools, actualDbId];
      writeLocal(LS_UPVOTED, next);
      setUpvotedTools(next);

      window.dispatchEvent(new CustomEvent("toolVotesUpdated", {
        detail: { toolId: actualDbId, votes: result.votes, isUpvoted: !alreadyUpvoted },
      }));
      toast.success(action === "upvote" ? "Tool upvoted." : "Upvote removed.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = async (dbToolId: string) => {
    if (!dbToolId || !mongoose.Types.ObjectId.isValid(dbToolId)) {
      toast.error("Invalid tool ID for saving.");
      return;
    }
    const alreadySaved = savedTools.includes(dbToolId);
    const next = alreadySaved
      ? savedTools.filter((id) => id !== dbToolId)
      : [...savedTools, dbToolId];
    writeLocal(LS_SAVED, next);
    setSavedTools(next);
    toast.success(alreadySaved ? "Removed from saved." : "Tool saved.");
  };

  return {
    upvotedTools,
    savedTools,
    isUpvoted,
    isSaved,
    toggleUpvote,
    toggleSave,
    isLoading,
  };
}

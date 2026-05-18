import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/constants";
import mongoose from 'mongoose'; // For ObjectId.isValid (frontend check)

// DEFAULT_VOTE_COUNT can be imported if needed for display fallbacks elsewhere
// import { DEFAULT_VOTE_COUNT } from '@/utils/voteUtils';

interface UserMetadata {
  upvotedTools?: string[];
  savedTools?: string[];
}

interface ToolActions {
  upvotedTools: string[];
  savedTools: string[];
  isUpvoted: (dbToolId: string) => boolean;
  isSaved: (dbToolId: string) => boolean;
  toggleUpvote: (actualDbId: string, currentVoteCount: number) => Promise<void>; // Pass current votes for immediate UI update
  toggleSave: (dbToolId: string) => Promise<void>;
  isLoading: boolean;
  // getVoteCount is removed, vote counts come from the tool object directly.
}

export function useToolActions(): ToolActions {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [upvotedTools, setUpvotedTools] = useState<string[]>([]);
  const [savedTools, setSavedTools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserPreferences = useCallback(async () => {
    if (isSignedIn && user) {
      try {
        const metadata = user.unsafeMetadata as UserMetadata;
        setUpvotedTools(metadata.upvotedTools || []);
        setSavedTools(metadata.savedTools || []);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    } else {
      setUpvotedTools([]);
      setSavedTools([]);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    loadUserPreferences();
  }, [loadUserPreferences]);

  const isUpvoted = (dbToolId: string): boolean => {
    if (!isSignedIn || !dbToolId) return false;
    return upvotedTools.includes(dbToolId);
  };

  const isSaved = (dbToolId: string): boolean => {
    if (!isSignedIn || !dbToolId) return false;
    return savedTools.includes(dbToolId);
  };

  const toggleUpvote = async (actualDbId: string, currentVoteCount: number) => {
    if (!isSignedIn) {
      toast.error("Please sign in to upvote tools.");
      return;
    }
    if (!actualDbId || actualDbId.startsWith('temp-') || !mongoose.Types.ObjectId.isValid(actualDbId)) {
      toast.error("This tool cannot be upvoted (invalid or temporary ID).");
      console.warn("toggleUpvote called with invalid or temporary ID:", actualDbId);
      return;
    }

    setIsLoading(true);
    const alreadyUpvoted = upvotedTools.includes(actualDbId);
    const action = alreadyUpvoted ? "downvote" : "upvote";

    try {
      console.log(`Attempting to ${action} tool with DB ID: ${actualDbId}`);
      const response = await fetch(`${API_BASE_URL}/api/tools/${actualDbId}/vote`, {
        method: 'POST', // Backend tools.ts supports POST for /:id/vote
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || typeof result.votes !== 'number') {
        throw new Error(result.error || "Failed to update vote on server.");
      }

      // Update Clerk user metadata
      const newUpvotedTools = alreadyUpvoted
        ? upvotedTools.filter(id => id !== actualDbId)
        : [...upvotedTools, actualDbId];
      
      await user?.update({ unsafeMetadata: { ...user.unsafeMetadata, upvotedTools: newUpvotedTools } });
      setUpvotedTools(newUpvotedTools); // Update local hook state

      // Dispatch event for UI updates elsewhere (e.g., AIToolDetail page)
      window.dispatchEvent(new CustomEvent('toolVotesUpdated', {
        detail: { toolId: actualDbId, votes: result.votes, isUpvoted: !alreadyUpvoted }
      }));
      
      toast.success(action === "upvote" ? "Tool upvoted!" : "Upvote removed.");

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error(`Error during toggleUpvote for ${actualDbId}:`, errorMessage, error);
      toast.error(errorMessage || "Failed to update vote. Please try again.");
      // Optionally, could try to re-sync preferences if update failed
      await loadUserPreferences(); 
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = async (dbToolId: string) => {
    if (!isSignedIn) {
      toast.error("Please sign in to save tools.");
      return;
    }
    if (!dbToolId || !mongoose.Types.ObjectId.isValid(dbToolId)) {
        toast.error("Invalid tool ID for saving.");
        return;
    }
    setIsLoading(true);
    const alreadySaved = savedTools.includes(dbToolId);
    const newSavedTools = alreadySaved
        ? savedTools.filter(id => id !== dbToolId)
        : [...savedTools, dbToolId];
    try {
        await user?.update({ unsafeMetadata: { ...user.unsafeMetadata, savedTools: newSavedTools } });
        setSavedTools(newSavedTools);
        toast.success(alreadySaved ? "Removed from saved." : "Tool saved!");
    } catch (error) {
        console.error('Error toggling save:', error);
        toast.error("Failed to update saved tools.");
        await loadUserPreferences(); // Re-sync on error
    } finally {
        setIsLoading(false);
    }
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
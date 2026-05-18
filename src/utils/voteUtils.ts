/**
 * Utility functions for handling vote counts
 */

/**
 * Default vote count for display purposes if needed.
 */
export const DEFAULT_VOTE_COUNT = 181;

/**
 * Placeholder for any general initialization if needed in the future.
 * Currently does nothing as localStorage for votes is removed.
 */
export const initializeVoteCounts = () => {
  console.log('initializeVoteCounts called - no localStorage operations for votes anymore.');
  // No operations needed here for a DB-only vote system.
};

/**
 * Gets the upvoted state and vote count consistently for a tool
 * @param toolId - The ID of the tool
 * @param defaultCount - Default vote count if none is stored
 * @returns Object with isUpvoted and voteCount
 */
export const getToolVoteState = (toolId: string, defaultCount: number = DEFAULT_VOTE_COUNT) => {
  if (!toolId) return { isUpvoted: false, voteCount: defaultCount };
  
  try {
    // For sponsored tools, handle special vote and upvote state
    const isSponsoredTool = toolId.startsWith('sponsored-');
    
    // Set up keys to check
    const voteKey = `localVotes_${toolId}`;
    const upvoteKey = `localUpvote_${toolId}`;
    
    // Get current stored state
    const storedVotes = localStorage.getItem(voteKey);
    const upvoteState = localStorage.getItem(upvoteKey) === 'true';
    
    // For sponsored tools, enforce our minimum vote count
    let voteCount = storedVotes ? parseInt(storedVotes, 10) : defaultCount;
    
    // Handle invalid or zero values
    if (isNaN(voteCount) || voteCount < defaultCount) {
      voteCount = defaultCount;
      // Save it back to ensure consistency on refresh
      localStorage.setItem(voteKey, voteCount.toString());
    }
    
    // Always ensure sponsored tools have our default votes at minimum
    if (isSponsoredTool && voteCount < defaultCount) {
      voteCount = defaultCount;
      localStorage.setItem(voteKey, voteCount.toString());
    }
    
    // Return consistent state
    return {
      isUpvoted: upvoteState,
      voteCount: voteCount
    };
  } catch (error) {
    console.error('Error getting tool vote state:', error);
    return { isUpvoted: false, voteCount: defaultCount };
  }
}; 
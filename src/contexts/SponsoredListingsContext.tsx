import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SponsoredListing } from '@/themes/theme-one/components/SponsoredListings';
import { toast } from 'sonner';

interface SponsoredListingsContextType {
  listings: SponsoredListing[];
  isLoading: boolean;
  error: string | null;
  refreshListings: () => void;
  addListing: (listing: Partial<SponsoredListing>) => Promise<void>;
  updateListing: (id: string, listing: Partial<SponsoredListing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
}

const SponsoredListingsContext = createContext<SponsoredListingsContextType>({
  listings: [],
  isLoading: false,
  error: null,
  refreshListings: () => {},
  addListing: async () => {},
  updateListing: async () => {},
  deleteListing: async () => {},
});

export const useSponsoredListings = () => useContext(SponsoredListingsContext);

export const SponsoredListingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [listings, setListings] = useState<SponsoredListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle API response
  const handleApiResponse = useCallback(async (response: Response) => {
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If response is not JSON, use text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 100)}...`;
          }
        } catch {
          // If even text fails, use default error message
        }
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }, []);

  // Fetch all sponsorships from the API
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sponsorships`);
      const data = await handleApiResponse(res);
      
      const listingsWithIds = data.map((listing: SponsoredListing) => {
        if (!listing.id) {
          console.warn(`Found listing "${listing.name}" without ID, generating temporary ID`);
          const tempId = `temp-${listing.slug || listing.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          return {...listing, id: tempId};
        }
        return listing;
      });
      
      // Log any listings with missing IDs for debugging
      const missingIdListings = listingsWithIds.filter((l: SponsoredListing) => 
        !l.id || l.id.startsWith('temp-')
      );
      
      if (missingIdListings.length > 0) {
        console.warn(`${missingIdListings.length} listings have missing or generated IDs:`, 
          missingIdListings.map(l => ({ name: l.name, id: l.id }))
        );
      }
      
      setListings(listingsWithIds);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sponsored listings';
      console.error('Error fetching sponsorships:', errorMessage);
      setError(errorMessage);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiResponse]);

  // Add a new sponsorship via API
  const addListing = async (listing: Partial<SponsoredListing>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sponsorships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing),
      });
      await handleApiResponse(res);
      await fetchListings();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sponsorship';
      console.error('Error creating sponsorship:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a sponsorship via API
  const updateListing = async (id: string, listing: Partial<SponsoredListing>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sponsorships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing),
      });
      await handleApiResponse(res);
      await fetchListings();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update sponsorship';
      console.error('Error updating sponsorship:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a sponsorship via API
  const deleteListing = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    if (!id) {
      const errorMsg = 'Error: Attempting to delete sponsorship with undefined ID';
      console.error(errorMsg);
      setError('Cannot delete sponsorship: ID is undefined');
      setIsLoading(false);
      throw new Error(errorMsg);
    }
    
    try {
      console.log(`Deleting sponsorship with ID: "${id}"`);
      
      // First, remove it from state immediately to improve UI responsiveness
      setListings(prevListings => {
        return prevListings.filter(listing => listing.id !== id);
      });
      
      // For temp IDs, we don't need to make API calls
      if (id.startsWith('temp-')) {
        console.log(`Skipping API delete for temporary ID: ${id}`);
        toast.success('Listing removed from view');
        setIsLoading(false);
        return;
      }
      
      const deleteUrl = `/api/sponsorships/${id}`;
      console.log(`Delete URL: ${deleteUrl}`);
      
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Delete response status: ${res.status}`);
      
      // Check if response is OK before trying to parse it
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error response from server: ${errorText.substring(0, 200)}`);
        
        // If it's a 404, the item might already be deleted
        if (res.status === 404) {
          console.log("Item not found on server (404) - it may already be deleted");
          // We already removed it from state, so just return success
          setIsLoading(false);
          return;
        }
        
        throw new Error(`Failed to delete sponsorship. Server returned: ${res.status} ${res.statusText}`);
      }
      
      // Handle potential non-JSON responses
      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const textResponse = await res.text();
        console.log(`Non-JSON response from delete (this may be normal): ${textResponse.substring(0, 100)}...`);
        
        // Some APIs return empty responses on successful delete
        if (res.status >= 200 && res.status < 300) {
          // Successfully deleted even though response is not JSON
          console.log('Delete was successful based on status code');
        } else {
          throw new Error(`Server returned non-JSON response with status ${res.status}`);
        }
      } else {
        // Only try to parse JSON if we have a JSON content type
        if (contentType?.includes('application/json')) {
          await handleApiResponse(res);
        }
      }
      
      console.log(`Successfully deleted listing with ID ${id}`);
      
      // We're not refreshing the full list anymore since we already updated state
      // This prevents the deleted item from reappearing if the server has issues
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete sponsorship';
      console.error('Error deleting sponsorship:', errorMessage);
      setError(errorMessage);
      
      // If there was an error, refresh the list to ensure we have the correct state
      await fetchListings();
      
      throw err; // Re-throw to allow the calling component to handle it
    } finally {
      setIsLoading(false);
    }
  };

  const refreshListings = () => {
    fetchListings();
  };

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <SponsoredListingsContext.Provider 
      value={{ 
        listings, 
        isLoading, 
        error, 
        refreshListings,
        addListing,
        updateListing,
        deleteListing
      }}
    >
      {children}
    </SponsoredListingsContext.Provider>
  );
}; 
import { useState } from "react";
import Image from 'next/image';
import { SponsoredListing } from "../../../components/SponsoredListings";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye, 
  Search,
  ExternalLink,
  Star,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSponsoredListings } from "@/contexts/SponsoredListingsContext";
import { SponsoredListingFormDialog } from "@/themes/theme-one/components/admin/sponsorships/SponsoredListingFormDialog";

export default function SponsoredListingsManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<SponsoredListing | undefined>();
  
  // Get all needed functions and data from context
  const { 
    listings, 
    isLoading, 
    error, 
    refreshListings, 
    addListing, 
    updateListing, 
    deleteListing 
  } = useSponsoredListings();

  if (error) {
    console.error('Error fetching sponsored listings:', error);
    toast.error('Failed to load sponsored listings');
  }

  const filteredListings = listings.filter(listing =>
    listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getListingImageUrl = (listing: SponsoredListing) => {
    if (listing.logo) return listing.logo;
    if (listing.url) {
      try {
        const hostname = new URL(listing.url).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch {
        const domain = listing.url.replace(/^https?:\/\//, '').split('/')[0];
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.name || 'Listing')}`;
  };

  const handleSubmit = async (data: Partial<SponsoredListing>) => {
    try {
      if (selectedListing) {
        // Update existing listing
        updateListing(selectedListing.id, data);
        toast.success(`Updated sponsored listing: ${data.name}`);
      } else {
        // Add new listing
        addListing(data);
        toast.success(`Created new sponsored listing: ${data.name}`);
      }
      setFormOpen(false);
      setSelectedListing(undefined);
    } catch (error) {
      console.error('Error saving sponsored listing:', error);
      toast.error("Failed to save sponsored listing");
    }
  };

  const handleEdit = (listing: SponsoredListing) => {
    setSelectedListing(listing);
    setFormOpen(true);
  };

  const handleDelete = async (listing: SponsoredListing) => {
    if (!listing.id) {
      console.error('Cannot delete listing with undefined ID:', listing);
      toast.error(`Cannot delete ${listing.name}: Missing ID`);
      return;
    }
    
    // Check if this has a temporary ID (generated client-side)
    const isTempId = typeof listing.id === 'string' && listing.id.startsWith('temp-');
    
    if (isTempId) {
      if (window.confirm(`Would you like to remove ${listing.name} from the displayed listings?\n\nNote: This may not delete it from the database.`)) {
        try {
          // Use the deleteListing function which now handles temp IDs properly
          await deleteListing(listing.id);
          toast.success(`Removed ${listing.name} from view`);
        } catch (error) {
          console.error('Error removing listing:', error);
          toast.error("Failed to remove listing");
        }
      }
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${listing.name} from sponsored listings?`)) {
      try {
        console.log(`Attempting to delete listing with ID: ${listing.id}`);
        await deleteListing(listing.id);
        toast.success(`Deleted sponsored listing: ${listing.name}`);
      } catch (error) {
        console.error('Error deleting sponsored listing:', error);
        toast.error("Failed to delete sponsored listing");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sponsored Listings</h2>
            <p className="text-sm text-gray-500">
              Manage sponsored and featured listings on the homepage
            </p>
          </div>
          <Button onClick={() => {
            setSelectedListing(undefined);
            setFormOpen(true);
          }}
          className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Sponsorship
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sponsored listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative">
                          <Image
                            src={getListingImageUrl(listing)}
                            alt={listing.name || 'Listing logo'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <div className="font-medium">{listing.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[300px]">
                            {listing.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100">
                        {listing.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400" />
                        <span>{listing.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {listing.views.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(listing)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/ai-tools/${listing.slug}`, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(listing.url, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Visit Website
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(listing)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <SponsoredListingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        listing={selectedListing}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 
'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookmarkIcon,
  Settings,
  Plus,
  Heart,
  Wrench,
  Bell,
  User,
  Mail,
  Lock,
  ThumbsUp,
  Activity,
  TrendingUp,
  Star,
  Calendar,
  ChevronRight,
  LogOut,
  CreditCard,
  Receipt,
  ExternalLink,
  Edit,
  BarChart3,
  Users,
} from "lucide-react";
import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tool } from '@/types/tool';
import { useUserPurchases, useUpdatePurchase, type Purchase } from '@/lib/api/payments';
import { getUserDisplayName } from '@/lib/utils';
import AffiliatePage from '@/app/dashboard/affiliate/page';

// PurchasesTab Component
function PurchasesTab({ userId }: { userId?: string }) {
  const { data: purchases, isLoading, error } = useUserPurchases(userId);
  const updatePurchase = useUpdatePurchase();
  const { toast } = useToast();
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editForm, setEditForm] = useState({
    toolId: '',
    toolName: '',
    toolUrl: '',
    notes: ''
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      case 'featured':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'sponsored':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      toolId: purchase.toolId || '',
      toolName: purchase.toolName || '',
      toolUrl: purchase.toolUrl || '',
      notes: purchase.notes || ''
    });
  };

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;

    try {
      await updatePurchase.mutateAsync({
        purchaseId: editingPurchase._id,
        data: editForm
      });

      toast({
        title: "Success",
        description: "Purchase updated successfully",
      });

      setEditingPurchase(null);
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update purchase",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load purchases</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">My Purchases</h2>
        <Button onClick={() => window.open('/advertise', '_blank')} className="gap-2">
          <Plus className="w-4 h-4" />
          New Purchase
        </Button>
      </div>

      {purchases && purchases.length > 0 ? (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <Card key={purchase._id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Receipt className="w-5 h-5 text-green-600" />
                      {purchase.planName}
                      <Badge className={getPlacementColor(purchase.placement)} variant="secondary">
                        {purchase.placement}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Order #{purchase._id.slice(-8).toUpperCase()} •
                      Purchased {formatDate(purchase.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(purchase.status)}>
                      {purchase.status}
                    </Badge>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {formatCurrency(purchase.amount, purchase.currency)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Campaign Details */}
                {purchase.toolName && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Campaign Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-800">
                        <span className="font-medium">Tool:</span>
                        {purchase.toolUrl ? (
                          <a
                            href={purchase.toolUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            {purchase.toolName}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span>{purchase.toolName}</span>
                        )}
                      </div>
                      {purchase.notes && (
                        <div className="text-blue-700">
                          <span className="font-medium">Notes:</span> {purchase.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{purchase.analytics.impressions}</div>
                    <div className="text-sm text-gray-600">Impressions</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{purchase.analytics.clicks}</div>
                    <div className="text-sm text-gray-600">Clicks</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{purchase.analytics.ctr.toFixed(2)}%</div>
                    <div className="text-sm text-gray-600">CTR</div>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Duration: {formatDate(purchase.startDate)} - {formatDate(purchase.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    <span>{purchase.paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}</span>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-medium mb-2">Features Included:</h4>
                  <div className="flex flex-wrap gap-2">
                    {purchase.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPurchase(purchase)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Details
                  </Button>
                  {purchase.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchases Yet</h3>
            <p className="text-gray-600 mb-6">
              Start advertising your AI tool to reach thousands of potential users.
            </p>
            <Button onClick={() => window.open('/advertise', '_blank')} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4" />
              Browse Advertising Plans
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Purchase Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={(open) => !open && setEditingPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign Details</DialogTitle>
            <DialogDescription>
              Update your tool information and campaign notes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePurchase} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="toolName">Tool Name</Label>
              <Input
                id="toolName"
                value={editForm.toolName}
                onChange={(e) => setEditForm(prev => ({ ...prev, toolName: e.target.value }))}
                placeholder="Enter your tool name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toolUrl">Tool URL</Label>
              <Input
                id="toolUrl"
                type="url"
                value={editForm.toolUrl}
                onChange={(e) => setEditForm(prev => ({ ...prev, toolUrl: e.target.value }))}
                placeholder="https://yourtool.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Campaign Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about your campaign..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPurchase(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatePurchase.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {updatePurchase.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [activeTab, setActiveTab] = useState("saved");
  const [savedPageSize, setSavedPageSize] = useState(6);
  const [upvotedPageSize, setUpvotedPageSize] = useState(6);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile editing state
  const [editingField, setEditingField] = useState<'name' | 'username' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Avatar generator state
  const [selectedStyle, setSelectedStyle] = useState("avataaars");
  const [seed, setSeed] = useState(user?.id || "random");

  // Fetch user purchases
  const { data: purchases } = useUserPurchases(user?.id);

  // Saved and upvoted tools lists from user metadata
  const savedTools = useMemo(() => (user?.unsafeMetadata?.savedTools as string[]) || [], [user?.unsafeMetadata?.savedTools]);
  const upvotedTools = useMemo(() => (user?.unsafeMetadata?.upvotedTools as string[]) || [], [user?.unsafeMetadata?.upvotedTools]);

  // Submit form state
  const [submitForm, setSubmitForm] = useState<{
    name: string;
    description: string;
    website: string;
    category: string;
  }>({
    name: "",
    description: "",
    website: "",
    category: "",
  });

  // Get the actual tool objects for saved and upvoted tools
  // Try both id and _id fields for better matching
  const savedToolObjects = tools.filter(tool => {
    const toolId = tool.id || tool._id;
    return savedTools.includes(toolId);
  });

  const upvotedToolObjects = tools.filter(tool => {
    const toolId = tool.id || tool._id;
    return upvotedTools.includes(toolId);
  });

  // Purchase stats
  const activePurchases = purchases?.filter(p => p.status === 'active').length || 0;
  const totalPurchases = purchases?.length || 0;

  // First, add an API URL constant if it doesn't exist

  // Avatar styles
  const avatarStyles = [
    { value: "avataaars", label: "Default" },
    { value: "pixel-art", label: "Pixel Art" },
    { value: "bottts", label: "Robots" },
    { value: "initials", label: "Initials" },
    { value: "fun-emoji", label: "Fun Emoji" },
  ];

  const getAvatarUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  const updateProfileImage = async (style: string, seed: string) => {
    if (!user) return;

    setIsUpdating(true);
    const avatarUrl = getAvatarUrl(style, seed);

    try {
      // Fetch the SVG content
      const response = await fetch(avatarUrl);
      if (!response.ok) throw new Error('Failed to fetch avatar');

      // Convert SVG to PNG using canvas
      const svgBlob = await response.blob();
      const img = new window.Image();
      const svgUrl = URL.createObjectURL(svgBlob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 400;  // Set size for good quality
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert to PNG'));
        }, 'image/png');
      });

      // Create file from blob
      const file = new File([pngBlob], 'avatar.png', { type: 'image/png' });

      // Update user's profile image using Clerk
      await user.setProfileImage({ file });

      // Cleanup
      URL.revokeObjectURL(svgUrl);

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenUserProfile = () => {
    try {
      // Try to open Clerk user profile modal
      if (openUserProfile) {
        openUserProfile();
      } else {
        throw new Error('Clerk user profile not available');
      }
    } catch (error) {
      console.warn('Clerk user profile modal not available, providing alternative:', error);

      // Fallback: Show instructions or redirect to Clerk dashboard
      toast({
        title: "Profile Editing",
        description: "Use the inline editing fields above or visit your Clerk dashboard.",
        variant: "default",
      });
    }
  };

  const handleStartEditing = (field: 'name' | 'username') => {
    setEditingField(field);
    if (field === 'name') {
      setEditingValue(getUserDisplayName(user) || '');
    } else if (field === 'username') {
      setEditingValue((user?.unsafeMetadata?.customUsername as string) || user?.username || '');
    }
  };

  const handleCancelEditing = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const handleSaveField = async () => {
    if (!user || !editingField || !editingValue.trim()) return;

    setIsUpdatingProfile(true);
    try {
      if (editingField === 'name') {
        // Store display name in unsafeMetadata to avoid API parameter issues
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            displayName: editingValue.trim()
          }
        });
      } else if (editingField === 'username') {
        // Store custom username in unsafeMetadata to avoid API parameter issues
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            customUsername: editingValue.trim()
          }
        });
      }

      toast({
        title: "Success",
        description: `${editingField === 'name' ? 'Name' : 'Username'} updated successfully!`,
        variant: "default",
      });

      setEditingField(null);
      setEditingValue('');
    } catch (error: unknown) {
      console.error('Error updating profile:', error);

      let errorMessage = `Failed to update ${editingField}. Please try again.`;

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Update stats to be more dynamic
  const stats = [
    { label: "Saved Tools", value: savedToolObjects.length, icon: BookmarkIcon, color: "text-green-600", bgColor: "bg-green-100" },
    { label: "Upvoted", value: upvotedToolObjects.length, icon: ThumbsUp, color: "text-green-600", bgColor: "bg-green-100" },
  ];

  // Debug logging to help understand the tool matching issue
  useEffect(() => {
    if (savedTools.length > 0) {
      console.log("Saved tool IDs from user metadata:", savedTools.length, savedTools.slice(0, 5));
      console.log("Found saved tools from API:", savedToolObjects.length);

      const missingTools = savedTools.filter(id => !savedToolObjects.some(tool => (tool.id || tool._id) === id));
      if (missingTools.length > 0) {
        console.log("Missing saved tools:", missingTools.length, missingTools.slice(0, 5));
        console.log("Available tool IDs:", tools.slice(0, 5).map(tool => tool.id || tool._id));
      }
    }
  }, [savedTools, savedToolObjects, tools]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSubmitTool = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to submit a tool",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, we would use the API client to submit the tool
      // For now, we're just simulating the submission with a timeout
      // In a real app, you would use something like:

      // TODO: Replace this simulation with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // const { useSubmitTool } = await import("@/lib/api/submissions");
      // const submitToolMutation = useSubmitTool();
      // await submitToolMutation.mutateAsync(submitForm);

      toast({
        title: "Success",
        description: "Tool submitted successfully!",
        variant: "default",
      });
      setIsSubmitModalOpen(false);
      setSubmitForm({
        name: "",
        description: "",
        website: "",
        category: "",
      });
    } catch (error) {
      console.error('Tool submission error:', error);
      let errorMessage = 'Failed to submit tool';

      // Handle authentication errors specifically
      if (error instanceof Error) {
        if (error.message.includes('Authentication required') ||
          error.message.includes('Unauthorized')) {
          errorMessage = 'You must be logged in to submit a tool';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a utility function to get the correct image URL
  const getToolImageUrl = (tool: Tool) => {
    // Try different properties that might contain the image
    if (tool.websiteUrl) {
      return `https://www.google.com/s2/favicons?domain=${tool.websiteUrl}&sz=128`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}`;
  };

  // Also let's add a cleanup effect to remove dead references to tools that no longer exist
  // This is optional but helps keep the user's data cleaner over time

  useEffect(() => {
    // Skip if user isn't signed in or tools aren't loaded yet
    if (!user || !tools.length || isLoadingTools) return;

    // Find tool IDs that no longer exist in the database
    const allToolIds = tools.map(tool => tool.id || tool._id);
    const orphanedSaved = savedTools.filter(id => !allToolIds.includes(id));
    const orphanedUpvoted = upvotedTools.filter(id => !allToolIds.includes(id));

    // Log the orphaned tools for debugging
    if (orphanedSaved.length > 0) {
      console.log(`Found ${orphanedSaved.length} saved tools that no longer exist:`, orphanedSaved);
    }

    if (orphanedUpvoted.length > 0) {
      console.log(`Found ${orphanedUpvoted.length} upvoted tools that no longer exist:`, orphanedUpvoted);
    }

    // In the future, you could implement cleanup by updating the user's metadata in Clerk:
    /*
    if ((orphanedSaved.length > 0 || orphanedUpvoted.length > 0) && user) {
      const updatedSaved = savedTools.filter(id => allToolIds.includes(id));
      const updatedUpvoted = upvotedTools.filter(id => allToolIds.includes(id));
      
      user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          savedTools: updatedSaved,
          upvotedTools: updatedUpvoted
        }
      }).then(() => {
        console.log("Successfully cleaned up orphaned tool references");
      }).catch(err => {
        console.error("Failed to clean up orphaned tools:", err);
      });
    }
    */
  }, [user, tools, savedTools, upvotedTools, isLoadingTools]);

  // Add an effect to fetch tools
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoadingTools(true);

        // Fetch saved and upvoted tools by their IDs
        const allToolIds = [...savedTools, ...upvotedTools];
        const uniqueToolIds = [...new Set(allToolIds)];

        let toolsData: Tool[] = [];

        if (uniqueToolIds.length > 0) {
          // Fetch tools by IDs
          const idsParam = uniqueToolIds.join(',');
          const response = await fetch(`/api/tools?ids=${idsParam}`);
          if (response.ok) {
            const result = await response.json();
            toolsData = Array.isArray(result) ? result : result.data || [];
          }
        }

        // Also fetch some recent tools for the dashboard (for other tabs)
        const recentResponse = await fetch(`/api/tools?limit=50&status=published`);
        if (recentResponse.ok) {
          const recentResult = await recentResponse.json();
          const recentTools = Array.isArray(recentResult) ? recentResult : recentResult.data || [];

          // Merge with tools fetched by IDs, avoiding duplicates
          const existingIds = new Set(toolsData.map(t => t.id || t._id));
          const newTools = recentTools.filter((t: Tool) => !existingIds.has(t.id || t._id));
          toolsData = [...toolsData, ...newTools];
        }

        setTools(toolsData);
      } catch (error) {
        console.error('Error fetching tools:', error);
      } finally {
        setIsLoadingTools(false);
      }
    };

    // Only fetch if user is signed in and has saved/upvoted tools
    if (user && (savedTools.length > 0 || upvotedTools.length > 0)) {
      fetchTools();
    } else if (user) {
      // Still fetch some recent tools even if no saved/upvoted
      fetch(`/api/tools?limit=50&status=published`)
        .then(res => res.json())
        .then(result => {
          const toolsData = Array.isArray(result) ? result : result.data || [];
          setTools(toolsData);
        })
        .catch(err => console.error('Error fetching tools:', err))
        .finally(() => setIsLoadingTools(false));
    }
  }, [user, savedTools, upvotedTools]);

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Submit Tool Modal */}
      <Dialog
        open={isSubmitModalOpen && !!user}
        onOpenChange={(open) => {
          // Only allow opening if user is logged in
          if (open && !user) {
            toast({
              title: "Authentication Required",
              description: "Please log in to submit a new tool",
              variant: "destructive",
            });
            return;
          }
          setIsSubmitModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit New Tool</DialogTitle>
            <DialogDescription>
              Submit a new AI tool to share with the community.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTool} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name</Label>
              <Input
                id="name"
                value={submitForm.name}
                onChange={(e) => setSubmitForm({ ...submitForm, name: e.target.value })}
                placeholder="Enter tool name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={submitForm.description}
                onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                placeholder="Describe what the tool does"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                value={submitForm.website}
                onChange={(e) => setSubmitForm({ ...submitForm, website: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={submitForm.category}
                onValueChange={(value) => setSubmitForm({ ...submitForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="AI Chatbots and Assistants">AI Chatbots and Assistants</SelectItem>
                  <SelectItem value="AI for Image Generation">AI for Image Generation</SelectItem>
                  <SelectItem value="AI for Content Creation">AI for Content Creation</SelectItem>
                  <SelectItem value="AI for Video Generation">AI for Video Generation</SelectItem>
                  <SelectItem value="AI for Coding and Development">AI for Coding and Development</SelectItem>
                  <SelectItem value="AI for Productivity">AI for Productivity</SelectItem>
                  <SelectItem value="AI for Social Media">AI for Social Media</SelectItem>
                  <SelectItem value="AI for Marketing">AI for Marketing</SelectItem>
                  <SelectItem value="AI for Audio Generation">AI for Audio Generation</SelectItem>
                  <SelectItem value="AI for Voice Generation">AI for Voice Generation</SelectItem>
                  <SelectItem value="AI for Text Enhancement">AI for Text Enhancement</SelectItem>
                  <SelectItem value="AI for Video Editing">AI for Video Editing</SelectItem>
                  <SelectItem value="AI for Image Editing">AI for Image Editing</SelectItem>
                  <SelectItem value="AI for SEO">AI for SEO</SelectItem>
                  <SelectItem value="AI for Transcription">AI for Transcription</SelectItem>
                  <SelectItem value="AI for Translation">AI for Translation</SelectItem>
                  <SelectItem value="AI for Data Analysis">AI for Data Analysis</SelectItem>
                  <SelectItem value="AI for HR and Recruitment">AI for HR and Recruitment</SelectItem>
                  <SelectItem value="AI for E-commerce">AI for E-commerce</SelectItem>
                  <SelectItem value="AI for Automation">AI for Automation</SelectItem>
                  <SelectItem value="AI for Research">AI for Research</SelectItem>
                  <SelectItem value="AI Search Engines and Research Tools">AI Search Engines and Research Tools</SelectItem>
                  <SelectItem value="AI for Gaming">AI for Gaming</SelectItem>
                  <SelectItem value="AI for Education">AI for Education</SelectItem>
                  <SelectItem value="AI for Healthcare">AI for Healthcare</SelectItem>
                  <SelectItem value="AI for Finance">AI for Finance</SelectItem>
                  <SelectItem value="AI for Music Generation">AI for Music Generation</SelectItem>
                  <SelectItem value="AI for Audio Enhancement">AI for Audio Enhancement</SelectItem>
                  <SelectItem value="AI for Self-Improvement">AI for Self-Improvement</SelectItem>
                  <SelectItem value="AI for Fun">AI for Fun</SelectItem>
                  <SelectItem value="AI for Inspiration">AI for Inspiration</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  "Submit Tool"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Header with User Info */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-green-100 shadow-xl relative">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <Image
                src={getAvatarUrl(selectedStyle, seed)}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
        </div>
        <div className="flex-grow text-center md:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">
            Welcome back, {getUserDisplayName(user) || (user?.unsafeMetadata?.customUsername as string) || user?.username || "User"}!
          </h1>
          <p className="text-gray-600 mb-6">
            {user?.emailAddresses?.[0]?.emailAddress || ""}
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Button
              variant="outline"
              className="gap-2 border-green-200 hover:border-green-300 text-green-600 hover:text-green-700"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <BookmarkIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Saved Tools</p>
                <h3 className="text-2xl font-bold text-gray-900">{savedToolObjects.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Upvoted</p>
                <h3 className="text-2xl font-bold text-gray-900">{upvotedToolObjects.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Plans</p>
                <h3 className="text-2xl font-bold text-gray-900">{activePurchases}</h3>
                <p className="text-xs text-gray-500">{totalPurchases} total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-transparent h-auto p-0">
              <TabsTrigger
                value="saved"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 h-24 rounded-xl border border-gray-200 hover:border-green-200 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <BookmarkIcon className="w-6 h-6" />
                  <span>Saved Tools</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="upvoted"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 h-24 rounded-xl border border-gray-200 hover:border-green-200 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <ThumbsUp className="w-6 h-6" />
                  <span>Upvoted</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="purchases"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 h-24 rounded-xl border border-gray-200 hover:border-green-200 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  <span>Purchases</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="affiliate"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 h-24 rounded-xl border border-gray-200 hover:border-green-200 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-6 h-6" />
                  <span>Affiliate</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 h-24 rounded-xl border border-gray-200 hover:border-green-200 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <Settings className="w-6 h-6" />
                  <span>Settings</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Saved Tools */}
            <TabsContent value="saved" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Saved Tools</h2>
                <span className="text-sm text-gray-500">Showing {Math.min(savedToolObjects.length, savedPageSize)} of {savedToolObjects.length}</span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedToolObjects.length > 0 ? (
                  savedToolObjects.slice(0, savedPageSize).map((tool) => (
                    <Link href={`/ai-tools/${tool.id}`}
                      key={tool.id}
                      className="group relative bg-white rounded-3xl p-6 shadow-sm ring-1 ring-black/[0.08] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 flex-shrink-0 relative">
                          <Image
                            src={getToolImageUrl(tool)}
                            alt={tool.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                          {tool.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400" />
                          {tool.rating}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No saved tools yet</p>
                  </div>
                )}
              </div>

              {/* Load More button for saved tools */}
              {savedToolObjects.length > savedPageSize && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    className="border-green-200 hover:border-green-300 text-green-700"
                    onClick={() => setSavedPageSize(prev => prev + 6)}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Upvoted Tools */}
            <TabsContent value="upvoted" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Upvoted Tools</h2>
                <span className="text-sm text-gray-500">Showing {Math.min(upvotedToolObjects.length, upvotedPageSize)} of {upvotedToolObjects.length}</span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upvotedToolObjects.length > 0 ? (
                  upvotedToolObjects.slice(0, upvotedPageSize).map((tool) => (
                    <Link href={`/ai-tools/${tool.id}`}
                      key={tool.id}
                      className="group relative bg-white rounded-3xl p-6 shadow-sm ring-1 ring-black/[0.08] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 flex-shrink-0 relative">
                          <Image
                            src={getToolImageUrl(tool)}
                            alt={tool.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                            {tool.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Star className="w-4 h-4 text-yellow-400" />
                            {tool.rating}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                          <ThumbsUp className="w-4 h-4" />
                          {tool.votes}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No upvoted tools yet</p>
                  </div>
                )}
              </div>

              {/* Load More button for upvoted tools */}
              {upvotedToolObjects.length > upvotedPageSize && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    className="border-green-200 hover:border-green-300 text-green-700"
                    onClick={() => setUpvotedPageSize(prev => prev + 6)}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="purchases" className="space-y-6">
              <PurchasesTab userId={user?.id} />
            </TabsContent>

            {/* Affiliate Tab */}
            <TabsContent value="affiliate" className="space-y-6">
              <AffiliatePage />
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your profile and account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Generator Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Avatar Generator
                    </h3>
                    <div className="flex items-start gap-8">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-green-100 relative">
                          <Image
                            src={getAvatarUrl(selectedStyle, seed)}
                            alt="Selected Avatar"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                      <div className="flex-grow space-y-4">
                        <div className="space-y-2">
                          <Label>Avatar Style</Label>
                          <Select
                            value={selectedStyle}
                            onValueChange={setSelectedStyle}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              {avatarStyles.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  {style.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Randomize</Label>
                          <div className="flex gap-2">
                            <Input
                              value={seed}
                              onChange={(e) => setSeed(e.target.value)}
                              placeholder="Enter text to generate avatar"
                              className="flex-grow"
                            />
                            <Button
                              variant="outline"
                              onClick={() => setSeed(Math.random().toString())}
                              className="flex-shrink-0"
                            >
                              Randomize
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={() => updateProfileImage(selectedStyle, seed)}
                          className="w-full"
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </div>
                          ) : (
                            "Update Profile Picture"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Existing Profile Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <div className="flex gap-2">
                          {editingField === 'name' ? (
                            <>
                              <Input
                                id="name"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                placeholder="Enter your name"
                                autoFocus
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSaveField}
                                disabled={isUpdatingProfile || !editingValue.trim()}
                              >
                                {isUpdatingProfile ? "..." : "Save"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditing}
                                disabled={isUpdatingProfile}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Input id="name" value={getUserDisplayName(user)} readOnly />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartEditing('name')}
                              >
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.emailAddresses?.[0]?.emailAddress || ""} readOnly />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="username">Username</Label>
                      <div className="flex gap-2">
                        {editingField === 'username' ? (
                          <>
                            <Input
                              id="username"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              placeholder="Enter your username"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleSaveField}
                              disabled={isUpdatingProfile || !editingValue.trim()}
                            >
                              {isUpdatingProfile ? "..." : "Save"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEditing}
                              disabled={isUpdatingProfile}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Input id="username" value={(user?.unsafeMetadata?.customUsername as string) || user?.username || ""} readOnly />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEditing('username')}
                            >
                              Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <Button
                        variant="outline"
                        onClick={handleOpenUserProfile}
                      >
                        Edit Profile in Clerk
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="space-y-6">
          {/* Trending Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Trending Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingTools ? (
                  <div className="flex justify-center py-4">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  tools
                    .filter(tool => tool.isTrending)
                    .slice(0, 3)
                    .map((tool, index) => (
                      <div key={tool.id || tool._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-gray-900 truncate">{tool.name}</p>
                          <p className="text-sm text-gray-500">{tool.category}</p>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm font-medium">{tool.votes}</span>
                        </div>
                      </div>
                    ))
                )}
                {!isLoadingTools && tools.filter(tool => tool.isTrending).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No trending tools available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
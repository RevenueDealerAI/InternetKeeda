import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/constants';

interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

interface UserMetadata {
  bio?: string;
  socialLinks?: SocialLinks;
  [key: string]: unknown;
}

interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  profileImageUrl: string;
  bio?: string;
  socialLinks?: SocialLinks;
}

interface ApiError {
  message: string;
  [key: string]: unknown;
}

export function useUserProfile() {
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isSignedIn) return;

    // Map Clerk user data to our format
    const userProfile: UserProfileData = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.emailAddresses[0]?.emailAddress || '',
      username: user.username || '',
      profileImageUrl: user.imageUrl || '',
      bio: (user.publicMetadata?.bio as string) || '',
      socialLinks: (user.publicMetadata?.socialLinks as SocialLinks) || {},
    };

    setProfile(userProfile);
  }, [user, isSignedIn]);

  // Function to sync profile with backend
  const syncProfileWithBackend = async () => {
    if (!user || !isSignedIn) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.emailAddresses[0]?.emailAddress,
          username: user.username,
          profileImageUrl: user.imageUrl,
          publicMetadata: user.publicMetadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync profile');
      }

      const data = await response.json();
      toast.success('Profile synced successfully');
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred syncing profile';
      setError(errorMessage);
      toast.error('Failed to sync profile with backend');
      console.error('Profile sync error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update user profile in Clerk
  const updateProfile = async (data: Partial<UserProfileData>) => {
    if (!user || !isSignedIn) return null;
    
    setIsLoading(true);
    setError(null);

    try {
      // Prepare the update data
      const updateData: Record<string, unknown> = {};
      
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.username !== undefined) updateData.username = data.username;
      
      // Handle metadata separately
      const metadata: Record<string, unknown> = { ...user.publicMetadata };
      if (data.bio !== undefined) metadata.bio = data.bio;
      if (data.socialLinks !== undefined) metadata.socialLinks = data.socialLinks;
      
      // Update user in Clerk
      await user.update({
        ...updateData,
        publicMetadata: metadata
      } as Parameters<typeof user.update>[0]);

      // After updating in Clerk, sync with our backend
      await syncProfileWithBackend();
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...data } : null);
      
      toast.success('Profile updated successfully');
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred updating profile';
      setError(errorMessage);
      toast.error('Failed to update profile');
      console.error('Profile update error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    syncProfileWithBackend
  };
} 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { User } from '@/types/user';


// API functions
async function getUsers(token: string): Promise<User[]> {
  console.log('Fetching users...');
  const response = await fetch(`/api/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Error fetching users:', errorData);
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Received users:', data.length);
  return data;
}

async function updateUserRole(token: string, userId: string, role: User['role'], reason: string) {
  // Clean userId - remove user_ prefix if present
  const cleanUserId = userId.replace('user_', '');
  console.log('Updating role for user:', {
    originalId: userId,
    cleanId: cleanUserId,
    role,
    reason
  });
  
  const response = await fetch(`/api/users/user/${cleanUserId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId: cleanUserId, role, reason }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Role update failed:', errorData);
    throw new Error(errorData.error || `Failed to update user role: ${response.status}`);
  }

  const data = await response.json();
  console.log('Role update successful:', data);
  return data;
}

async function updateUserStatus(token: string, userId: string, status: User['status'], reason: string) {
  // Clean userId - remove user_ prefix if present
  const cleanUserId = userId.replace('user_', '');
  console.log('Updating status for user:', {
    originalId: userId,
    cleanId: cleanUserId,
    status,
    reason
  });

  const response = await fetch(`/api/users/user/${cleanUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId: cleanUserId, status, reason }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Status update failed:', errorData);
    throw new Error(errorData.error || `Failed to update user status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Status update successful:', data);
  return data;
}

async function getUserActivity(token: string, userId: string) {
  // Remove 'user_' prefix if it exists
  const cleanUserId = userId.replace('user_', '');

  const response = await fetch(`/api/users/user/${cleanUserId}/activity`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch user activity: ${response.status}`);
  }
  return response.json();
}

async function setAdminRole(token: string, userId: string) {
  // Remove 'user_' prefix if it exists
  const cleanUserId = userId.replace('user_', '');

  const response = await fetch(`/api/users/user/${cleanUserId}/set-admin-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// React Query hooks
export function useUsers() {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        console.log('Fetching users with token:', token ? 'Present' : 'Missing');
        return getUsers(token);
      } catch (error) {
        console.error('Error in useUsers hook:', error);
        throw error;
      }
    },
  });
}

export function useUserActivity(userId: string) {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async () => {
      const token = await getToken();
      return getUserActivity(token, userId);
    },
    enabled: !!userId,
  });
}

export function useUpdateUserRole() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, reason }: { userId: string; role: User['role']; reason: string }) => {
      const token = await getToken();
      return updateUserRole(token, userId, role, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string; status: User['status']; reason: string }) => {
      const token = await getToken();
      return updateUserStatus(token, userId, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useSetAdminRole() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = await getToken();
      return setAdminRole(token, userId);
    },
  });
} 
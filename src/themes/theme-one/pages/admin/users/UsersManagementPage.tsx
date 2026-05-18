import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Search,
  UserCog,
  Shield,
  Trash2,
  History,
  Download,
  Mail,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user";
import { UserDetailsDialog } from "@/components/admin/users/UserDetailsDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUsers, useUpdateUserRole, useUpdateUserStatus } from "@/lib/api/users";
import { useAuth } from "@clerk/clerk-react";

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  // Removed legacy /health check - the app now runs fully on Next.js APIs.

  // Fetch users with debug logging
  const { data: users = [], isLoading, error } = useUsers();

  // Log detailed state for debugging
  console.log('Users query state:', {
    isLoading,
    error,
    userCount: users?.length || 0,
    isAdmin: true, // We're in the admin route so this must be true
    users
  });

  if (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
  }

  // Update user role mutation
  const updateRoleMutation = useUpdateUserRole();

  // Update user status mutation
  const updateStatusMutation = useUpdateUserStatus();

  // Add success/error handling for role updates
  React.useEffect(() => {
    if (updateRoleMutation.isSuccess) {
      toast.success('User role updated successfully');
      setSelectedUser(null); // Close the dialog
    }
    if (updateRoleMutation.isError) {
      toast.error(updateRoleMutation.error?.message || 'Failed to update user role');
    }
  }, [updateRoleMutation.isSuccess, updateRoleMutation.isError, updateRoleMutation.error]);

  // Add success/error handling for status updates
  React.useEffect(() => {
    if (updateStatusMutation.isSuccess) {
      toast.success('User status updated successfully');
      setSelectedUser(null); // Close the dialog
    }
    if (updateStatusMutation.isError) {
      toast.error(updateStatusMutation.error?.message || 'Failed to update user status');
    }
  }, [updateStatusMutation.isSuccess, updateStatusMutation.isError, updateStatusMutation.error]);

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeVariant = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'suspended':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'banned':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not Available';

    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? 'Invalid Date Format'
        : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date Error';
    }
  };

  const handleExport = () => {
    try {
      // Create CSV header
      const headers = [
        'Name',
        'Email',
        'Role',
        'Status',
        'Last Active',
        'Joined At'
      ].join(',');

      // Convert users data to CSV rows
      const rows = users.map(user => [
        `"${(user.name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(user.email || 'Unknown').replace(/"/g, '""')}"`,
        `"${user.role || 'Unknown'}"`,
        `"${user.status || 'Unknown'}"`,
        `"${formatDate(user.lastActive)}"`,
        `"${formatDate(user.joinedAt)}"`
      ].join(','));

      // Combine headers and rows
      const csv = [headers, ...rows].join('\n');

      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleInvite = () => {
    // TODO: Implement invite functionality
    toast.info("Invite functionality coming soon");
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to DELETE ${user.name}? This action cannot be undone and will permanently remove the user from the platform.`)) {
      try {
        const token = await getToken();
        const cleanUserId = user.id.replace('user_', '');

        const response = await fetch(`/api/users/user/${cleanUserId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to delete user');
        }

        toast.success('User deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete user');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] pt-20">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] pt-20">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">User Management</h2>
            <p className="text-sm text-gray-500">
              Manage and monitor user accounts
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-4">
            <Button variant="outline" className="flex-1 md:flex-none gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="flex-1 md:flex-none gap-2" onClick={handleInvite}>
              <Mail className="h-4 w-4" />
              Invite User
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="h-[600px] overflow-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>{user.name?.charAt(0) || ''}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500">{user.email || 'No Email'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getRoleBadgeVariant(user.role))}>
                        {user.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(user.status))}>
                        {user.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-500">
                        {formatDate(user.lastActive)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-500">
                        {formatDate(user.joinedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <History className="mr-2 h-4 w-4" />
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
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

        {selectedUser && (
          <UserDetailsDialog
            user={selectedUser}
            open={!!selectedUser}
            onOpenChange={(open) => !open && setSelectedUser(null)}
            onRoleChange={(role, reason) =>
              updateRoleMutation.mutate({ userId: selectedUser.id, role, reason })
            }
            onStatusChange={(status, reason) =>
              updateStatusMutation.mutate({ userId: selectedUser.id, status, reason })
            }
          />
        )}
      </div>
    </div>
  );
} 
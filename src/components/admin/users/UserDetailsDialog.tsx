import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Calendar,
  Clock,
  Shield,
  Activity,
  FileText,
  MessageSquare,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { User } from "@/types/user";
import { RoleChangeDialog } from "./RoleChangeDialog";
import { cn } from "@/lib/utils";
import { useUserActivity } from "@/lib/api/users";

// Define the activity type locally to avoid import issues
interface UserActivity {
  id: string;
  type: 'login' | 'submission' | 'comment' | 'role_change' | 'status_change' | 'account' | 'update' | 'activity';
  description: string;
  timestamp: string;
}

interface UserDetailsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (role: User['role'], reason: string) => void;
  onStatusChange: (status: User['status'], reason: string) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  onRoleChange,
  onStatusChange,
}: UserDetailsDialogProps) {
  const { toast } = useToast();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // Fetch user activity
  const { data: activityData } = useUserActivity(user.id);

  // Generate activity items from the activity data
  const activities = Array.isArray(activityData) ? activityData : [];

  // Generate synthesized activity items if we have an object instead of an array
  const generateActivityItems = () => {
    if (!activityData || Array.isArray(activityData)) return [];

    // Create synthesized activity items from the object data
    const items = [];

    if (activityData.lastSignInAt) {
      items.push({
        id: 'last-signin',
        type: 'login',
        description: 'User signed in',
        timestamp: activityData.lastSignInAt
      });
    }

    if (activityData.createdAt) {
      items.push({
        id: 'account-created',
        type: 'account',
        description: 'Account created',
        timestamp: activityData.createdAt
      });
    }

    if (activityData.updatedAt) {
      items.push({
        id: 'account-updated',
        type: 'update',
        description: 'Account information updated',
        timestamp: activityData.updatedAt
      });
    }

    if (activityData.lastActiveAt) {
      items.push({
        id: 'last-active',
        type: 'activity',
        description: 'Last active on platform',
        timestamp: activityData.lastActiveAt
      });
    }

    return items;
  };

  const activityItems = activities.length > 0 ? activities : generateActivityItems();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'login':
        return <Activity className="h-4 w-4" />;
      case 'submission':
        return <FileText className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'role_change':
        return <Shield className="h-4 w-4" />;
      case 'status_change':
        return <AlertTriangle className="h-4 w-4" />;
      case 'account':
        return <Calendar className="h-4 w-4" />;
      case 'update':
        return <Settings className="h-4 w-4" />;
      case 'activity':
        return <Clock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl">User Details</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-4 overflow-hidden flex-1">
            {/* User Profile Header */}
            <div className="flex flex-col md:flex-row items-start gap-6 p-6 bg-gray-50/80 rounded-xl border border-gray-100">
              <Avatar className="h-24 w-24 rounded-xl">
                <AvatarImage src={user.avatarUrl} className="rounded-xl" />
                <AvatarFallback className="rounded-xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 w-full">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold truncate">{user.name}</h2>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-auto py-1.5 px-3 text-sm font-medium capitalize w-full sm:w-auto justify-center sm:justify-start",
                      user.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        "bg-gray-50 text-gray-700 border-gray-200"
                    )}
                  >
                    <Shield className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    {user.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-auto py-1.5 px-3 text-sm font-medium bg-gray-50 text-gray-700 border-gray-200 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    Joined {formatDate(user.joinedAt)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-auto py-1.5 px-3 text-sm font-medium bg-gray-50 text-gray-700 border-gray-200 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    Last active {formatDate(user.lastActive)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                className="gap-2 h-9 px-4 w-full md:w-auto"
                onClick={() => setIsRoleDialogOpen(true)}
              >
                <Shield className="h-4 w-4" />
                Change Role
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="activity" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="w-full justify-start h-11 p-1 bg-gray-50/80 flex-shrink-0">
                <TabsTrigger value="activity" className="flex-1 max-w-[200px]">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity Log
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 max-w-[200px]">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="flex-1 overflow-hidden mt-4 flex flex-col">
                <Card className="border-gray-100 flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-xl">Recent Activity</CardTitle>
                    <CardDescription>User's recent actions and events</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4 pb-4">
                        {activityItems.length > 0 ? (
                          activityItems.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors"
                            >
                              <div className="p-2 rounded-lg bg-gray-50">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{activity.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-6 text-gray-500">
                            <p>No activity data available</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 overflow-hidden mt-4 flex flex-col">
                <Card className="border-gray-100 flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-xl">Account Settings</CardTitle>
                    <CardDescription>Manage user account settings and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-6 pb-4">
                        {user.status === "banned" && (
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-200">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-red-900">Account Banned</h4>
                              <p className="text-sm text-red-700 mt-1">
                                This account has been banned from the platform.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-4">
                          <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white">
                            <div>
                              <h4 className="font-medium">Account Status</h4>
                              <p className="text-sm text-gray-500 mt-1">Current account status and restrictions</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-7 px-3 capitalize",
                                user.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                                  user.status === "suspended" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                    "bg-red-50 text-red-700 border-red-200"
                              )}
                            >
                              {user.status}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white">
                            <div>
                              <h4 className="font-medium">Email Notifications</h4>
                              <p className="text-sm text-gray-500 mt-1">Receive email notifications</p>
                            </div>
                            <Button
                              variant="outline"
                              className="h-9 px-4"
                              onClick={() => {
                                toast({
                                  title: "Coming Soon",
                                  description: "Email notification configuration will be available in the next update.",
                                });
                              }}
                            >
                              Configure
                            </Button>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <RoleChangeDialog
        user={user}
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        onSubmit={(role, reason) => {
          onRoleChange(role, reason);
          setIsRoleDialogOpen(false);
        }}
      />
    </>
  );
} 
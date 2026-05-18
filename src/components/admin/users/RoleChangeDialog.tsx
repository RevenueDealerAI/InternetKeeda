import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { User } from "@/types/user";

interface RoleChangeDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (role: User['role'], reason: string) => void;
}

const ROLES = [
  {
    value: "user",
    label: "User",
    description: "Regular user with basic permissions",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full access to all platform features and settings",
  },
] as const;

export function RoleChangeDialog({ user, open, onOpenChange, onSubmit }: RoleChangeDialogProps) {
  const [selectedRole, setSelectedRole] = useState<User['role']>(user.role);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedRole, reason);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedRole(user.role);
      setReason("");
    }
    onOpenChange(newOpen);
  };

  const selectedRoleData = ROLES.find(role => role.value === selectedRole);
  const isRoleChange = selectedRole !== user.role;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="theme-two max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role and permissions for {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="p-3 rounded-lg bg-gray-50 text-sm capitalize">
              {user.role}
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: User['role']) => setSelectedRole(value)}
            >
              <SelectTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value} className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRoleData && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedRoleData.description}
              </p>
            )}
          </div>

          {isRoleChange && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for this role change..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-20 rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500"
                />
              </div>

              {(user.role === "admin" || selectedRole === "admin") && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Important Notice</h4>
                    <p className="text-sm text-yellow-700">
                      {user.role === "admin"
                        ? "Removing admin privileges will restrict access to administrative features."
                        : "Granting admin privileges will give full access to all platform features."}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isRoleChange || !reason || isSubmitting}
            className="gap-2 rounded-full bg-purple-600 text-white hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              'Update Role'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
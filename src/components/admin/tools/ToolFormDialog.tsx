import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tool } from "@/types/tool";
import { ToolForm } from "./ToolForm";

interface ToolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Tool;
  onSubmit: (data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function ToolFormDialog({ open, onOpenChange, initialData, onSubmit }: ToolFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Tool" : "Add New Tool"}</DialogTitle>
        </DialogHeader>
        <ToolForm initialData={initialData} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
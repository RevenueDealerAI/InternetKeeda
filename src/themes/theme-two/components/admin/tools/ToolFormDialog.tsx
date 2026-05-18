import { useEffect } from "react";
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

export function ToolFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: ToolFormDialogProps) {
  useEffect(() => {
    if (open) {
      const prevBody = document.body.style.overflow;
      const prevHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBody;
        document.documentElement.style.overflow = prevHtml;
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl overflow-hidden p-0">
        <div className="max-h-[90vh] overflow-y-auto overscroll-contain modal-scroll pl-6 pr-0 py-6 md:pl-8 md:py-6">
          <DialogHeader className="p-0">
            <DialogTitle>
              {initialData ? "Edit Tool" : "Add New Tool"}
            </DialogTitle>
          </DialogHeader>
          <ToolForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}



import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FAQ } from "@/lib/api/faq";
import { useEffect } from "react";

const faqFormSchema = z.object({
  question: z.string().min(2, "Question must be at least 2 characters"),
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  order: z.number().min(0),
  isActive: z.boolean(),
});

type FAQFormValues = z.infer<typeof faqFormSchema>;

interface FAQFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq?: FAQ;
  onSubmit: (data: FAQFormValues) => Promise<void>;
}

const FAQ_CATEGORIES = [
  "General",
  "Tools & Reviews",
  "Account & Community",
  "Pricing & Plans",
  "Technical Support",
];

export function FAQFormDialog({
  open,
  onOpenChange,
  faq,
  onSubmit,
}: FAQFormDialogProps) {
  const form = useForm<FAQFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "General",
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (faq) {
      form.reset({
        question: faq.question || "",
        answer: faq.answer || "",
        category: faq.category || "General",
        order: faq.order || 0,
        isActive: faq.isActive !== undefined ? faq.isActive : true,
      });
    } else {
      form.reset({
        question: "",
        answer: "",
        category: "General",
        order: 0,
        isActive: true,
      });
    }
  }, [faq, form]);

  const handleSubmit = async (data: FAQFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-two max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{faq ? "Edit FAQ" : "Create New FAQ"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter question"
                      {...field}
                      className="rounded-full focus-visible:ring-2 focus-visible:ring-orange-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter answer"
                      rows={6}
                      {...field}
                      className="rounded-xl focus-visible:ring-2 focus-visible:ring-orange-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-orange-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FAQ_CATEGORIES.map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                          >
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="rounded-full focus-visible:ring-2 focus-visible:ring-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <div className="text-sm text-gray-500">
                      Show this FAQ on the public page
                    </div>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-5 w-5 accent-orange-600 rounded cursor-pointer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-orange-600 text-white hover:bg-orange-700"
              >
                {faq ? "Update FAQ" : "Create FAQ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}





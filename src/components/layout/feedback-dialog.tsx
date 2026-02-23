"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { submitFeedback } from "@/actions/feedback";

type FeedbackCategory = "bug" | "suggestion" | "question" | "other";

const CATEGORIES: {
  value: FeedbackCategory;
  label: string;
  icon: typeof Bug;
}[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "question", label: "Question", icon: HelpCircle },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

export function FeedbackDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await submitFeedback(category, content, pathname);
      toast.success("Thanks for your feedback!");
      setContent("");
      setCategory("suggestion");
      setOpen(false);
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Send Feedback</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve VibeCodes. Bug reports, suggestions, and questions
            are all welcome.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-1">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => setCategory(cat.value)}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </Button>
            ))}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              category === "bug"
                ? "Describe the bug and how to reproduce it..."
                : category === "suggestion"
                  ? "What would you like to see improved or added?"
                  : category === "question"
                    ? "What would you like to know?"
                    : "Tell us what's on your mind..."
            }
            rows={4}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {content.length}/5000
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
            >
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

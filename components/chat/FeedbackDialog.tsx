"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  rating: "positive" | "negative" | null;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  submitting?: boolean;
}

export function FeedbackDialog({
  open,
  rating,
  onClose,
  onSubmit,
  submitting,
}: Props) {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit(comment);
    setComment("");
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-background border-rule">
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-medium text-ink">
            {rating === "positive"
              ? "What worked well?"
              : "What could be better?"}
          </DialogTitle>
          <DialogDescription className="font-serif italic text-[14px] text-ink-2">
            Optional. Your feedback helps improve the agent.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            rating === "positive"
              ? "What did the agent get right?"
              : "What was missing or wrong?"
          }
          rows={4}
          maxLength={1000}
          className="font-serif text-[15px] leading-[1.55] bg-background border-rule"
        />
        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className={cn(
              "cursor-pointer font-serif italic text-[14px] text-ink-mute",
              "border-b border-rule pb-px",
              "hover:text-ink hover:border-rule-strong transition-colors",
            )}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5",
              "font-mono text-[11px] font-medium uppercase tracking-[0.14em]",
              "border border-accent bg-accent-soft text-accent-strong",
              "hover:bg-accent hover:text-accent-foreground transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            Send feedback
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

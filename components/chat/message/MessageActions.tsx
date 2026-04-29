"use client";

// Action row beneath the assistant turn. Italic serif "Was this useful?"
// prompt + Helpful · Not helpful · Copy as text affordances with hairline
// underlines. Each submitted state turns ink-blue and stays sticky.
//
// Copy is single-action when the message has no SQL; otherwise it expands
// into an inline rollout offering Answer / SQL / Both. The rollout is
// outside-click and Escape-dismissable.

import { useEffect, useRef, useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  AlignLeft,
  Database,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionLink, CopyInlineOption, Sep } from "./primitives";

interface Props {
  messageContent: string;
  sql?: string;
  onFeedback?: (
    rating: "positive" | "negative",
    comment: string,
    messageId: number,
  ) => Promise<void>;
  messageId?: number;
  submittedRating: "positive" | "negative" | null;
  submitting: boolean;
  openFeedback: (rating: "positive" | "negative") => void;
}

export function MessageActions({
  messageContent,
  sql,
  onFeedback,
  messageId,
  submittedRating,
  submitting,
  openFeedback,
}: Props) {
  const [popOpen, setPopOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<
    "copy" | "text" | "sql" | "both" | null
  >(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const hasSql = !!sql && sql.trim().length > 0;
  const showFeedback = !!onFeedback && !!messageId;

  useEffect(() => {
    if (!popOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setPopOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [popOpen]);

  const flashCopied = (key: "copy" | "text" | "sql" | "both") => {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1400);
  };

  const writeToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyClick = async () => {
    if (hasSql) {
      setPopOpen((open) => !open);
      return;
    }
    if (await writeToClipboard(messageContent.trim())) flashCopied("copy");
  };

  const handlePopAction = async (kind: "text" | "sql" | "both") => {
    const text = messageContent.trim();
    const sqlBody = (sql ?? "").trim();
    let payload = "";
    if (kind === "text") payload = text;
    if (kind === "sql") payload = sqlBody;
    if (kind === "both") payload = `${text}\n\n--- SQL ---\n${sqlBody}`;
    if (await writeToClipboard(payload)) {
      flashCopied(kind);
      flashCopied("copy");
      window.setTimeout(() => setPopOpen(false), 600);
    }
  };

  return (
    <div
      ref={rowRef}
      role="group"
      aria-label="Message actions"
      className={cn(
        "relative flex flex-wrap items-center gap-x-[18px] gap-y-2",
        "mt-4 pt-3 border-t border-rule",
        "font-serif italic text-[13.5px]",
      )}
    >
      <span className="text-ink-mute">Was this useful?</span>

      {showFeedback && (
        <>
          <ActionLink
            onClick={() => openFeedback("positive")}
            disabled={submittedRating !== null || submitting}
            submitted={submittedRating === "positive"}
            icon={
              <ThumbsUp
                className="size-3.5"
                fill={submittedRating === "positive" ? "currentColor" : "none"}
              />
            }
          >
            Helpful
          </ActionLink>
          <Sep />
          <ActionLink
            onClick={() => openFeedback("negative")}
            disabled={submittedRating !== null || submitting}
            submitted={submittedRating === "negative"}
            icon={
              <ThumbsDown
                className="size-3.5"
                fill={submittedRating === "negative" ? "currentColor" : "none"}
              />
            }
          >
            Not helpful
          </ActionLink>
          <Sep />
        </>
      )}

      <div
        className="inline-flex items-center gap-1.5"
        onMouseLeave={() => { if (popOpen) setPopOpen(false); }}
        onKeyDown={(e) => {
          if (!popOpen) return;
          const items = Array.from(
            rowRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
          );
          if (e.key === "ArrowDown") {
            e.preventDefault();
            const i = items.findIndex((el) => el === document.activeElement);
            items[(i + 1) % items.length]?.focus();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            const i = items.findIndex((el) => el === document.activeElement);
            items[(i - 1 + items.length) % items.length]?.focus();
          }
        }}
      >
        <ActionLink
          onClick={handleCopyClick}
          submitted={copiedKey === "copy"}
          ariaHaspopup={hasSql ? "menu" : undefined}
          ariaExpanded={hasSql ? popOpen : undefined}
          icon={
            copiedKey === "copy" ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )
          }
        >
          {copiedKey === "copy" ? "Copied" : "Copy"}
        </ActionLink>

        {hasSql && (
          <div
            role="menu"
            aria-label="Copy options"
            aria-hidden={!popOpen}
            className="copy-popup-menu inline-flex items-center gap-0.5 rounded-sm bg-surface-2 px-1 py-0.5"
          >
            <CopyInlineOption
              icon={<AlignLeft className="size-3.5" />}
              label="Answer"
              copied={copiedKey === "text"}
              onClick={() => handlePopAction("text")}
            />
            <CopyInlineOption
              icon={<Database className="size-3.5" />}
              label="SQL"
              copied={copiedKey === "sql"}
              onClick={() => handlePopAction("sql")}
            />
            <CopyInlineOption
              icon={<Layers className="size-3.5" />}
              label="Both"
              copied={copiedKey === "both"}
              onClick={() => handlePopAction("both")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

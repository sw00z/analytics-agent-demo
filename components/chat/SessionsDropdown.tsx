"use client";

// Editorial-paper sessions affordance. Replaces the prior left sidebar with
// a "Recent ▾" italic-serif link in the masthead. Opens a dropdown of past
// conversations; each row has a serif title + mono small-caps relative time
// + ellipsis menu to delete. Active session gets an accent left rule.

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollbarThumb } from "@/components/chat/panel/ScrollbarThumb";
import {
  listSessions,
  deleteSession,
  type SessionSummary,
} from "@/lib/api/agent";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  currentSessionId: number | null;
  onSelect: (id: number | null) => void;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function SessionsDropdown({
  userId,
  currentSessionId,
  onSelect,
}: Props) {
  const qc = useQueryClient();
  const actionsRef = useRef<MenuPrimitive.Root.Actions>(null);
  const scrollListRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", userId],
    queryFn: () => listSessions(userId),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSession(userId, id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["sessions", userId] });
      if (currentSessionId === id) onSelect(null);
    },
  });

  const activeTitle =
    currentSessionId !== null
      ? sessions.find((s) => s.id === currentSessionId)?.title
      : undefined;

  return (
    <DropdownMenu actionsRef={actionsRef}>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 cursor-pointer outline-none",
          "font-serif italic text-[14px] text-ink-2",
          "border-b border-rule pb-px",
          "hover:text-accent-strong hover:border-accent",
          "data-popup-open:text-accent-strong data-popup-open:border-accent",
          "transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-ring rounded-[2px]",
          activeTitle && "text-accent-strong border-accent",
        )}
      >
        <span className="max-w-[180px] truncate">
          {activeTitle ?? "Recent"}
        </span>
        <ChevronDown className="size-3 text-ink-mute" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        onMouseLeave={() => actionsRef.current?.close()}
        className="min-w-[300px] max-w-[360px] p-0 rounded-md overflow-hidden bg-background ring-1 ring-rule shadow-[0_8px_24px_-4px_var(--shadow-ink)]"
      >
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "flex items-center gap-2 w-full text-left px-4 py-3 cursor-pointer",
            "border-b border-rule",
            "font-serif italic text-[14px] text-ink-2",
            "hover:text-accent-strong hover:bg-surface-2 transition-colors",
            "focus:outline-none focus-visible:bg-surface-2",
          )}
        >
          <Plus className="size-3.5 text-ink-mute" />
          New conversation
        </button>

        <div className="relative">
          <div
            ref={scrollListRef}
            className="max-h-[320px] overflow-y-auto scrollbar-none"
          >
            {isLoading && (
              <div className="px-4 py-3 font-serif italic text-[13.5px] text-ink-mute">
                Loading…
              </div>
            )}
            {!isLoading && sessions.length === 0 && (
              <div className="px-4 py-3 font-serif italic text-[13.5px] text-ink-mute">
                No conversations yet.
              </div>
            )}
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                active={s.id === currentSessionId}
                onSelect={() => onSelect(s.id)}
                onDelete={() => deleteMutation.mutate(s.id)}
              />
            ))}
          </div>
          <ScrollbarThumb scrollRef={scrollListRef} variant="edge" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SessionRow({
  session,
  active,
  onSelect,
  onDelete,
}: {
  session: SessionSummary;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group/row relative flex items-start gap-2 px-4 py-3",
        "border-b border-rule last:border-b-0",
        active && "bg-surface-2",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Open conversation: ${session.title}`}
        className={cn(
          "absolute inset-0 cursor-pointer outline-none",
          "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        )}
      />
      {/* Active rule */}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-2 bottom-2 w-px bg-accent pointer-events-none"
        />
      )}
      <div className="relative pointer-events-none flex-1 min-w-0">
        <div
          className={cn(
            "font-serif text-[14px] leading-tight truncate",
            active ? "text-accent-strong" : "text-ink",
          )}
        >
          {session.title}
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-ink-mute mt-1">
          {relativeTime(session.updatedAt)}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete conversation: ${session.title}`}
        className={cn(
          "relative shrink-0 grid place-items-center size-6 rounded cursor-pointer",
          "text-ink-mute hover:text-destructive",
          "opacity-0 group-hover/row:opacity-100 focus:opacity-100",
          "transition-opacity",
        )}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

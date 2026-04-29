"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemoUser } from "@/lib/hooks/useDemoUser";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SessionsDropdown } from "@/components/chat/SessionsDropdown";

export function ChatShell() {
  const userId = useDemoUser();
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  if (!userId) {
    return (
      <div className="h-screen flex items-center justify-center text-sm italic text-ink-mute">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-rule px-6 sm:px-14 h-[70px] flex items-center gap-7">
        <div className="flex items-baseline gap-3">
          <span
            aria-hidden
            className="inline-block size-[9px] -translate-y-px rounded-[1px] bg-accent"
          />
          <span className="font-serif text-[17px] font-semibold tracking-[0.01em] text-ink">
            Analytics Agent
          </span>
          <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-[0.10em] text-ink-mute border-l border-rule pl-3">
            Issue 27 · Brazilian e-commerce
          </span>
        </div>
        <div className="flex-1" />
        <SessionsDropdown
          userId={userId}
          currentSessionId={currentSessionId}
          onSelect={setCurrentSessionId}
        />
        <Link
          href="https://github.com/sw00z/analytics-agent-demo"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 font-serif italic text-[14px] text-ink-2 border-b border-rule pb-px hover:text-accent-strong hover:border-accent transition-colors"
        >
          <GithubMark className="size-3.5" />
          Source
        </Link>
      </header>
      <main className="flex-1 min-h-0 relative overflow-hidden">
        <ChatPanel
          userId={userId}
          currentSessionId={currentSessionId}
          onSessionChange={setCurrentSessionId}
        />
      </main>
    </div>
  );
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.13c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.16 1.18a10.94 10.94 0 015.76 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.77 1.06.77 2.14v3.17c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

"use client";

// Small visual primitives shared by MessageActions. ActionLink is the
// hairline-underlined affordance used for Helpful / Not helpful / Copy;
// CopyInlineOption is the soft-shaded inner-rollout option matching
// ActionLink rhythm but with a `surface-2` hover instead of an underline.

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sep() {
  return (
    <span aria-hidden className="not-italic text-ink-mute">
      ·
    </span>
  );
}

interface ActionLinkProps {
  onClick: () => void;
  disabled?: boolean;
  submitted?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  ariaHaspopup?: "menu" | undefined;
  ariaExpanded?: boolean;
}

export function ActionLink({
  onClick,
  disabled,
  submitted,
  icon,
  children,
  ariaHaspopup,
  ariaExpanded,
}: ActionLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      className={cn(
        "inline-flex items-center gap-1.5 cursor-pointer",
        "text-ink-2 border-b border-rule pb-px",
        "transition-colors duration-150",
        "hover:text-accent-strong hover:border-accent",
        "focus-visible:outline-none focus-visible:text-accent-strong focus-visible:border-accent",
        "disabled:pointer-events-none disabled:opacity-60",
        submitted && "text-accent-strong border-accent",
        "[&_svg]:text-ink-mute hover:[&_svg]:text-accent",
        submitted && "[&_svg]:text-accent",
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

interface CopyInlineOptionProps {
  icon: React.ReactNode;
  label: string;
  copied: boolean;
  onClick: () => void;
}

export function CopyInlineOption({
  icon,
  label,
  copied,
  onClick,
}: CopyInlineOptionProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 cursor-pointer",
        "px-2 py-1 rounded-sm whitespace-nowrap",
        "text-ink-2 transition-colors duration-150",
        "hover:bg-background hover:text-accent-strong",
        "focus-visible:outline-none focus-visible:bg-background focus-visible:text-accent-strong",
        "[&_svg]:text-ink-mute hover:[&_svg]:text-accent",
        copied && "bg-background text-accent-strong [&_svg]:text-accent",
      )}
    >
      {copied ? <Check className="size-3.5" /> : icon}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

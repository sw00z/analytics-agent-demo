"use client";

// Renders assistant prose as standard Markdown while preserving the editorial
// text treatment used by plain answers. Raw HTML is skipped; charts and SQL
// remain separate render paths in MessageBubble.

import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
}

const proseClass =
  "font-serif text-[17px] leading-[1.62] text-ink max-w-[60ch]";

const components: Components = {
  p: ({ children }) => (
    <p
      className={cn(
        proseClass,
        "my-3 first:mt-0 last:mb-0 whitespace-pre-wrap",
      )}
    >
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-ink">{children}</em>,
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 font-serif text-[23px] leading-tight text-ink first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 font-serif text-[20px] leading-tight text-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 font-serif text-[18px] leading-tight text-ink first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-1.5 font-serif text-[17px] font-semibold leading-tight text-ink first:mt-0">
      {children}
    </h4>
  ),
  ul: ({ children }) => (
    <ul className={cn(proseClass, "my-3 ml-5 list-disc space-y-1")}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className={cn(proseClass, "my-3 ml-5 list-decimal space-y-1")}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 max-w-[60ch] border-l-2 border-accent pl-4 font-serif italic text-[17px] leading-[1.62] text-ink-2">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-accent-strong underline decoration-rule underline-offset-[3px] transition-colors hover:text-accent hover:decoration-accent"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => (
    <code
      className={cn(
        "rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[12.5px] text-ink",
        className,
      )}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-4 max-w-[60ch] overflow-x-auto rounded border border-rule bg-surface-2 px-3.5 py-3 font-mono text-[12.5px] leading-[1.65] text-ink">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-5 max-w-[60ch] border-rule" />,
};

export function AssistantMarkdown({ content }: Props) {
  return (
    <div className="markdown-answer">
      <ReactMarkdown components={components} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}

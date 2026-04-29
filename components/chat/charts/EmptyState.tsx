// Rendered by ChartRenderer when a query returns zero rows. Italic serif
// matches the surrounding answer prose so the empty state reads as part of
// the figure caption rather than a separate UI affordance.

export function EmptyState() {
  return (
    <div className="font-serif italic text-[14px] text-ink-mute">
      No rows returned.
    </div>
  );
}

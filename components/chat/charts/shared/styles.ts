// Shared visual constants for all Recharts components in components/chat/charts.
// Tick / tooltip / axis styling lives here so per-chart files stay focused on
// their own data-shaping logic and don't drift apart on visual tokens.

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const TICK_STYLE = {
  fill: "var(--ink-mute)",
  fontSize: 9.5,
  fontFamily: "var(--font-plex-mono), monospace",
};

export const TOOLTIP_STYLE = {
  background: "var(--background)",
  border: "1px solid var(--rule)",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: 'var(--font-serif), "Iowan Old Style", Palatino, serif',
  color: "var(--ink)",
  boxShadow: "0 8px 24px -4px var(--shadow-ink)",
  padding: "8px 12px",
};

export const TOOLTIP_LABEL_STYLE = {
  color: "var(--ink-mute)",
  fontSize: 11,
  fontFamily: "var(--font-plex-mono), monospace",
  letterSpacing: "0.06em",
  marginBottom: 2,
};

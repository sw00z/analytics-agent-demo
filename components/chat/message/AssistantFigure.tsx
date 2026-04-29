"use client";

// Chart figure beneath the assistant prose. Mono uppercase kicker names
// the chart type, body delegates to ChartRenderer, italic serif caption
// reports row count in the chart-type's vocabulary.

import type { ChartConfig } from "@/lib/api/agent";
import { captionFor, humanLabelFor } from "@/lib/messages/labels";
import { ChartRenderer } from "../ChartRenderer";

interface Props {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export function AssistantFigure({ data, config }: Props) {
  return (
    <figure className="my-6 border-y border-rule py-4.5">
      <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-mute mb-2.5">
        Figure · {humanLabelFor(config.type)}
      </div>
      <ChartRenderer data={data} config={config} />
      <figcaption className="font-serif italic text-[13.5px] text-ink-mute mt-2.5 max-w-[50ch]">
        {captionFor(config.type, data.length)}
      </figcaption>
    </figure>
  );
}

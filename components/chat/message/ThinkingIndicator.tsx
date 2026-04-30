"use client";

// Quill icon doing a "writing" wobble that doesn't repeat. Each cycle is
// generated fresh by the Web Animations API with parameters drawn randomly
// from a believable-handwriting envelope: 3-4 strokes of varying amplitude,
// a lift-and-hover phase whose peak position drifts, and a soft settle
// back to a fixed rest pose so consecutive cycles chain without a seam.
//
// Two non-obvious reasons for going imperative rather than CSS:
//   1. CSS @keyframes are deterministic — the loop's exact trajectory
//      repeats every period, which the eye picks up after a few cycles
//      and reads as mechanical. WAAPI lets us randomize per cycle.
//   2. WAAPI animations don't run through CSS `animation-duration`, so
//      they're unaffected by the universal prefers-reduced-motion clamp
//      in globals.css. The indicator plays even when OS reduced-motion
//      is on, which is correct under WCAG 2.3.3 essential-motion.
//
// The animation is wrapped on a <span>, not on the <svg> directly, because
// Chromium's CSS-transform support on root <svg> elements is incomplete
// (crbug 40494105). The pivot at 78%/92% places the rotation origin near
// the Lucide Feather glyph's writing tip so the body wags from the page.

import { useEffect, useRef } from "react";
import { Feather } from "lucide-react";

const REST_POSE = "rotate(-15deg) translate(0px, 0px)";

interface CycleSpec {
  frames: Keyframe[];
  durationMs: number;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Build one cycle's keyframe sequence. All values stay inside an envelope
// tuned to look like genuine handwriting at 18px scale — tweaking the
// bounds here is the only knob you need.
function generateWriteCycle(): CycleSpec {
  const strokeCount = Math.random() < 0.5 ? 3 : 4;
  const xDriftPeak = rand(1.5, 3); // px
  const yLiftPeak = rand(1.6, 3); // px

  // Phase durations (seconds), summed to derive total cycle length.
  const strokePhaseSecs = strokeCount * rand(0.18, 0.24);
  const liftPhaseSecs = rand(0.45, 0.7);
  const settlePhaseSecs = rand(0.35, 0.55);
  const totalSecs = strokePhaseSecs + liftPhaseSecs + settlePhaseSecs;

  const frames: Keyframe[] = [{ transform: REST_POSE, offset: 0 }];
  let elapsed = 0;

  // Strokes — each contributes one peak (rotated forward, slight Y bob)
  // and a return (rotated back, on-baseline). The X drift advances
  // monotonically across all strokes so the wrist appears to track right.
  for (let i = 0; i < strokeCount; i++) {
    const strokeDur = strokePhaseSecs / strokeCount;
    const peakRot = rand(-3, 6);
    const returnRot = rand(-14, -10);
    const xAtStroke = (xDriftPeak * (i + 0.5)) / strokeCount;
    const yWobble = rand(-0.9, -0.2);

    frames.push({
      transform: `rotate(${peakRot.toFixed(1)}deg) translate(${xAtStroke.toFixed(2)}px, ${yWobble.toFixed(2)}px)`,
      offset: (elapsed + strokeDur * 0.4) / totalSecs,
    });
    frames.push({
      transform: `rotate(${returnRot.toFixed(1)}deg) translate(${(xAtStroke + 0.2).toFixed(2)}px, 0px)`,
      offset: (elapsed + strokeDur * 0.85) / totalSecs,
    });

    elapsed += strokeDur;
  }

  // Lift + hover — Y peak (writer pausing mid-thought) lands part way
  // through the lift phase rather than at its boundary so the entry
  // feels eased rather than abrupt.
  frames.push({
    transform: `rotate(${rand(-12, -7).toFixed(1)}deg) translate(${xDriftPeak.toFixed(2)}px, ${(-yLiftPeak).toFixed(2)}px)`,
    offset: (elapsed + liftPhaseSecs * rand(0.5, 0.7)) / totalSecs,
  });
  elapsed += liftPhaseSecs;

  // Settle — drift the wrist back toward the rest position, mostly
  // collapsed but still slightly elevated.
  frames.push({
    transform: `rotate(${rand(-14, -12).toFixed(1)}deg) translate(${(xDriftPeak * 0.3).toFixed(2)}px, ${(-yLiftPeak * 0.35).toFixed(2)}px)`,
    offset: (elapsed + settlePhaseSecs * 0.5) / totalSecs,
  });

  // End at the canonical rest pose so the next cycle picks up cleanly.
  frames.push({ transform: REST_POSE, offset: 1 });

  return { frames, durationMs: totalSecs * 1000 };
}

export function ThinkingIndicator() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let current: Animation | null = null;

    const playLoop = () => {
      if (cancelled) return;
      const { frames, durationMs } = generateWriteCycle();
      current = el.animate(frames, {
        duration: durationMs,
        easing: "cubic-bezier(0.45, 0, 0.55, 1)",
        iterations: 1,
        fill: "forwards",
      });
      current.onfinish = playLoop;
    };

    playLoop();

    return () => {
      cancelled = true;
      current?.cancel();
    };
  }, []);

  return (
    <div role="status" aria-label="Thinking" className="flex items-center py-1">
      <span
        ref={ref}
        aria-hidden="true"
        className="inline-flex [transform-origin:78%_92%] text-accent-strong"
      >
        <Feather className="size-[18px]" strokeWidth={1.5} />
      </span>
    </div>
  );
}

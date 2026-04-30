"use client";

// Custom overlay scrollbar — mirrors custom-scrollbar.html.
//   - Native browser scrollbar is hidden (.scrollbar-none on the scroller)
//   - Floating track inset from top/bottom of the scroll viewport
//   - Translucent navy thumb (matches --accent hue) with a thin tinted border
//   - Snappy 120ms reveal; 450ms easeOutQuint fade-out after a 600ms hold
//   - Drag the thumb to scroll; click empty track to page-jump
//   - Track hover OR active drag brightens the thumb (data-active=true)

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  // "floating" (default): inset rail used by the chat scroll host.
  // "edge": flush-to-right-edge, full-height rail for compact overflow
  // surfaces (e.g. SessionsDropdown) that want native-scrollbar placement.
  variant?: "floating" | "edge";
}

export function ScrollbarThumb({ scrollRef, variant = "floating" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollNode = scrollRef.current;
    const trackNode = trackRef.current;
    const thumbNode = thumbRef.current;
    if (!scrollNode || !trackNode || !thumbNode) return;

    let hideTimeout: number | null = null;
    let dragging = false;
    let hovering = false;
    const MIN_THUMB = 36;
    const HIDE_DELAY = 600;

    const update = () => {
      const trackH = trackNode.clientHeight;
      const viewH = scrollNode.clientHeight;
      const totalH = scrollNode.scrollHeight;
      const overflow = totalH - viewH;
      if (overflow <= 1 || trackH <= 0) {
        thumbNode.style.height = "0px";
        return;
      }
      const ratio = viewH / totalH;
      const height = Math.max(MIN_THUMB, Math.round(trackH * ratio));
      const maxThumbTop = trackH - height;
      const top =
        overflow === 0 ? 0 : (scrollNode.scrollTop / overflow) * maxThumbTop;
      thumbNode.style.height = `${height}px`;
      thumbNode.style.transform = `translate3d(0, ${top}px, 0)`;
    };

    const show = () => {
      trackNode.dataset.visible = "true";
      if (hideTimeout !== null) window.clearTimeout(hideTimeout);
      // Don't auto-hide while the thumb is being dragged or while the
      // pointer is hovering the rail — the user is actively engaging it.
      if (dragging || hovering) return;
      hideTimeout = window.setTimeout(() => {
        delete trackNode.dataset.visible;
      }, HIDE_DELAY);
    };

    const onScroll = () => {
      update();
      show();
    };

    // --- Drag the thumb to scroll ----------------------------------------
    const onThumbPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      trackNode.dataset.active = "true";
      show();
      const startY = e.clientY;
      const startScroll = scrollNode.scrollTop;
      thumbNode.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();

      const onMove = (ev: PointerEvent) => {
        const trackH = trackNode.clientHeight;
        const thumbH = thumbNode.offsetHeight;
        const maxThumbTop = trackH - thumbH;
        const maxScroll = scrollNode.scrollHeight - scrollNode.clientHeight;
        if (maxThumbTop <= 0 || maxScroll <= 0) return;
        const dy = ev.clientY - startY;
        scrollNode.scrollTop = startScroll + (dy / maxThumbTop) * maxScroll;
      };

      const finish = (ev: PointerEvent) => {
        dragging = false;
        delete trackNode.dataset.active;
        try {
          thumbNode.releasePointerCapture(ev.pointerId);
        } catch {}
        thumbNode.removeEventListener("pointermove", onMove);
        thumbNode.removeEventListener("pointerup", finish);
        thumbNode.removeEventListener("pointercancel", finish);
        show();
      };

      thumbNode.addEventListener("pointermove", onMove);
      thumbNode.addEventListener("pointerup", finish);
      thumbNode.addEventListener("pointercancel", finish);
    };

    // --- Click empty track to page-jump toward the click ------------------
    const onTrackPointerDown = (e: PointerEvent) => {
      if (e.target === thumbNode || e.button !== 0) return;
      const rect = trackNode.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const thumbTop = thumbNode.getBoundingClientRect().top - rect.top;
      const dir = clickY < thumbTop ? -1 : 1;
      scrollNode.scrollBy({
        top: dir * scrollNode.clientHeight * 0.9,
        behavior: "smooth",
      });
    };

    // Brighten thumb on track hover (matches `.sb-track:hover .sb-thumb`).
    // Hover also pins visibility — see show() for the dragging/hovering
    // short-circuit. On leave, kick off a fresh fade cycle.
    const onTrackEnter = () => {
      hovering = true;
      trackNode.dataset.active = "true";
      if (hideTimeout !== null) {
        window.clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    };
    const onTrackLeave = () => {
      hovering = false;
      if (!dragging) delete trackNode.dataset.active;
      show();
    };

    update();
    scrollNode.addEventListener("scroll", onScroll, { passive: true });
    thumbNode.addEventListener("pointerdown", onThumbPointerDown);
    trackNode.addEventListener("pointerdown", onTrackPointerDown);
    trackNode.addEventListener("pointerenter", onTrackEnter);
    trackNode.addEventListener("pointerleave", onTrackLeave);

    const ro = new ResizeObserver(update);
    ro.observe(scrollNode);
    if (scrollNode.firstElementChild) ro.observe(scrollNode.firstElementChild);

    return () => {
      scrollNode.removeEventListener("scroll", onScroll);
      thumbNode.removeEventListener("pointerdown", onThumbPointerDown);
      trackNode.removeEventListener("pointerdown", onTrackPointerDown);
      trackNode.removeEventListener("pointerenter", onTrackEnter);
      trackNode.removeEventListener("pointerleave", onTrackLeave);
      ro.disconnect();
      if (hideTimeout !== null) window.clearTimeout(hideTimeout);
    };
  }, [scrollRef]);

  return (
    <div
      ref={trackRef}
      aria-hidden
      className={cn(
        // Geometry + rail color come from one of the scrollbar-track-* utilities.
        variant === "edge" ? "scrollbar-track-edge" : "scrollbar-track-floating",
        "z-30 group",
        // Asymmetric easing: snappy reveal, 450ms easeOutQuint fade-out.
        "opacity-0 transition-opacity duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        "data-[visible=true]:opacity-100 data-[visible=true]:duration-[120ms]",
        // Track is only interactive while visible (otherwise invisible track
        // would block clicks on messages near the right edge).
        "pointer-events-none data-[visible=true]:pointer-events-auto",
      )}
    >
      <div
        ref={thumbRef}
        className={cn(
          "absolute inset-x-0 rounded-full cursor-grab",
          "scrollbar-thumb-navy",
          "transition-[background,border-color] duration-[160ms] ease-out",
          // Brighten on track hover OR while actively being dragged.
          "group-data-[active=true]:scrollbar-thumb-navy-hover",
          "group-data-[active=true]:cursor-grabbing",
        )}
        style={{ height: 0, willChange: "transform" }}
      />
    </div>
  );
}

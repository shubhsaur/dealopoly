"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimeout } from "./use-timers";

/**
 * Registers a global Escape key listener. Only fires when `active` is true.
 */
export function useEscapeKey(callback: () => void, active = true) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") savedCallback.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);
}

/**
 * Returns `{ copy, hasCopied }`. Calling `copy(text)` writes to the clipboard
 * and sets `hasCopied` to true for `timeoutMs` (default 2000).
 */
export function useCopyToClipboard(timeoutMs = 2000) {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !text) return;
      navigator.clipboard.writeText(text);
      setHasCopied(true);
    },
    [],
  );

  useTimeout(() => setHasCopied(false), hasCopied ? timeoutMs : null, hasCopied);

  return { copy, hasCopied };
}

/**
 * Enables pointer-based drag-to-scroll on the container referenced by `containerRef`.
 * Returns event handlers to spread onto the scrollable element and a `hasDraggedRef`
 * (useful for suppressing click events after a drag).
 */
export function useDragScroll(containerRef: React.RefObject<HTMLDivElement | null>) {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    scrollStartLeftRef.current = el.scrollLeft;
  }, [containerRef]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 6) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollStartLeftRef.current - deltaX;
  }, [containerRef]);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, hasDraggedRef };
}

/**
 * Tracks whether a scrollable container has content overflowing to the left or right.
 * Returns `{ canScrollLeft, canScrollRight }`.
 */
export function useScrollEdges(
  containerRef: React.RefObject<HTMLDivElement | null>,
  deps: unknown[] = [],
) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, ...deps]);

  return { canScrollLeft, canScrollRight };
}

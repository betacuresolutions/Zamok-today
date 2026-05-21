"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

export type AnchoredDropdownPosition = {
  top: number;
  left: number;
  width: number;
};

export function useAnchoredDropdownPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  options?: { gap?: number; maxWidth?: number; align?: "left" | "right" }
) {
  const gap = options?.gap ?? 8;
  const maxWidth = options?.maxWidth ?? 820;
  const align = options?.align ?? "left";
  const [position, setPosition] = useState<AnchoredDropdownPosition | null>(null);

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const width = Math.min(maxWidth, window.innerWidth - margin * 2);
    let left = align === "right" ? rect.right - width : rect.left;
    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - width);
    }
    setPosition({ top: rect.bottom + gap, left, width });
  }, [anchorRef, gap, maxWidth, align]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return position;
}

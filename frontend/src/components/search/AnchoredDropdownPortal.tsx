"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useAnchoredDropdownPosition } from "@/hooks/useAnchoredDropdownPosition";

type Props = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  className?: string;
  gap?: number;
  maxWidth?: number;
};

export function AnchoredDropdownPortal({
  open,
  anchorRef,
  panelRef,
  children,
  className,
  gap = 8,
  maxWidth = 820
}: Props) {
  const [mounted, setMounted] = useState(false);
  const position = useAnchoredDropdownPosition(anchorRef, open, { gap, maxWidth });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={className}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 75
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

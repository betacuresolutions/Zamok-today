"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";

/** Full-viewport picker shell (matches hotels / flights mobile overlays). */
export function MobileFullScreenSheet({
  open,
  mounted,
  title,
  onClose,
  children,
  footer,
  closeAriaLabel = "Close"
}: {
  open: boolean;
  mounted: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  closeAriaLabel?: string;
}) {
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-slate-100 dark:bg-black">
      <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-zinc-950">
        <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
          aria-label={closeAriaLabel}
        >
          <FiX className="h-6 w-6" />
        </button>
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-[720px] flex-1 flex-col p-4">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="shrink-0 pt-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";
import { useT } from "@/i18n/I18nProvider";
import type { HotelGuestsState } from "@/lib/hotelSearch";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  value: HotelGuestsState;
  onChange: (next: HotelGuestsState) => void;
};

export function HotelsGuestsPicker({ value, onChange }: Props) {
  const t = useT();
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const [open, setOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const guestCount = value.adults + value.children;
  const guestsLabel =
    guestCount === 1
      ? tr("search.hotels.guestOne", "1 Guest")
      : tr("search.hotels.guestsMany", "{{count}} Guests").replace("{{count}}", String(guestCount));
  const roomsLabel =
    value.rooms === 1
      ? tr("search.hotels.roomOne", "1 Room")
      : tr("search.hotels.roomsMany", "{{count}} Rooms").replace("{{count}}", String(value.rooms));
  useEffect(() => {
    setMounted(true);
    function syncViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      const node = e.target as Node;
      if (rootRef.current?.contains(node)) return;
      if (panelRef.current?.contains(node)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isMobileViewport) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isMobileViewport]);

  const canIncGuests = useMemo(() => guestCount < 16, [guestCount]);

  function setGuests(next: Partial<HotelGuestsState>) {
    const adults = Math.max(1, next.adults ?? value.adults);
    const children = Math.max(0, next.children ?? value.children);
    let rooms = Math.max(1, next.rooms ?? value.rooms);
    const totalGuests = adults + children;
    if (totalGuests > 16) return;
    if (rooms > totalGuests) rooms = totalGuests;
    onChange({ adults, children, rooms });
  }

  function CounterRow({
    title,
    subtitle,
    count,
    onDec,
    onInc,
    decDisabled,
    incDisabled
  }: {
    title: string;
    subtitle: string;
    count: number;
    onDec: () => void;
    onInc: () => void;
    decDisabled?: boolean;
    incDisabled?: boolean;
  }) {
    return (
      <div className="flex items-center justify-between gap-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
          <div className="text-xs text-slate-500 dark:text-white/60">{subtitle}</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDec}
            disabled={decDisabled}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full ring-1 transition",
              decDisabled
                ? "bg-slate-100 text-slate-300 ring-slate-200 cursor-not-allowed"
                : "bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200",
              "dark:bg-white/10 dark:ring-white/15 dark:hover:bg-white/15"
            )}
            aria-label={`Decrease ${title}`}
          >
            <FiMinus className="h-4 w-4" />
          </button>
          <div className="w-7 text-center text-base font-semibold text-slate-900 dark:text-white">{count}</div>
          <button
            type="button"
            onClick={onInc}
            disabled={incDisabled}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full ring-1 transition",
              incDisabled
                ? "bg-brand-100 text-brand-300 ring-brand-200 cursor-not-allowed"
                : "bg-brand-600 text-white ring-brand-600 hover:bg-brand-700"
            )}
            aria-label={`Increase ${title}`}
          >
            <FiPlus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const panel = (
    <div className="divide-y divide-slate-200 dark:divide-white/10">
      <CounterRow
        title={tr("search.hotels.adults", "Adults")}
        subtitle={tr("search.hotels.adultsHint", "18 years and older")}
        count={value.adults}
        onDec={() => setGuests({ adults: value.adults - 1 })}
        onInc={() => setGuests({ adults: value.adults + 1 })}
        decDisabled={value.adults <= 1}
        incDisabled={!canIncGuests}
      />
      <CounterRow
        title={tr("search.hotels.children", "Children")}
        subtitle={tr("search.hotels.childrenHint", "0–17 years old")}
        count={value.children}
        onDec={() => setGuests({ children: value.children - 1 })}
        onInc={() => setGuests({ children: value.children + 1 })}
        decDisabled={value.children <= 0}
        incDisabled={!canIncGuests}
      />
      <CounterRow
        title={tr("search.hotels.rooms", "Rooms")}
        subtitle={tr("search.hotels.roomsHint", "Number of rooms")}
        count={value.rooms}
        onDec={() => setGuests({ rooms: value.rooms - 1 })}
        onInc={() => setGuests({ rooms: value.rooms + 1 })}
        decDisabled={value.rooms <= 1}
        incDisabled={value.rooms >= guestCount}
      />
    </div>
  );

  return (
    <div className="relative w-full" ref={rootRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full truncate text-left">
        <div className="mt-1 truncate text-sm font-semibold text-slate-900 md:mt-0 dark:text-white">{guestsLabel}</div>
        <div className="hidden truncate text-sm text-slate-500 md:block dark:text-white/60">{roomsLabel}</div>
      </button>

      {open && !isMobileViewport ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("search.hotels.guests")}
          className="absolute -right-4 top-[calc(100%+12px)] z-[70] w-[min(440px,calc(100vw-2rem))] rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-black/10 dark:bg-black dark:ring-white/15"
        >
          <div className="text-xl font-bold text-slate-900 dark:text-white">{t("search.hotels.guests")}</div>
          <div className="mt-4">{panel}</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {tr("search.hotels.done", "Done")}
          </button>
        </div>
      ) : null}

      {open ? (
        <>
          {mounted && isMobileViewport
            ? createPortal(
                <div
                  className="fixed inset-0 z-[95] flex flex-col bg-slate-100 dark:bg-black"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setOpen(false);
                  }}
                >
                  <div
                    ref={panelRef}
                    className="flex min-h-0 flex-1 flex-col"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                  <div className="flex h-14 items-center justify-center border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-zinc-950">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{t("search.hotels.guests")}</div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="absolute right-4 grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
                      aria-label="Close"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="mx-auto w-full max-w-[720px] flex-1 overflow-y-auto p-4">
                    <div className="rounded-3xl bg-white p-4 ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/15">{panel}</div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="mt-4 w-full rounded-2xl bg-brand-600 px-4 py-3 text-base font-semibold text-white hover:bg-brand-700"
                    >
                      {tr("search.hotels.done", "Done")}
                    </button>
                  </div>
                  </div>
                </div>,
                document.body
              )
            : null}
        </>
      ) : null}
    </div>
  );
}

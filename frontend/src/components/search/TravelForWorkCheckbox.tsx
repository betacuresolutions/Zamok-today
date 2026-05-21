"use client";

import { FiCheck } from "react-icons/fi";
import { useT } from "@/i18n/I18nProvider";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function TravelForWorkCheckbox({
  checked,
  onChange,
  className,
  variant = "onLight"
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  variant?: "onLight" | "onBrand";
}) {
  const t = useT();
  const onBrand = variant === "onBrand";

  return (
    <label
      className={cn(
        "group inline-flex cursor-pointer select-none items-center gap-3",
        onBrand ? "text-sm font-medium text-white/95" : "text-sm font-medium text-slate-600 dark:text-slate-300",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "relative grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border-2 transition",
          onBrand &&
            "border-white bg-white shadow-sm group-hover:border-white group-hover:bg-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-white/90 peer-focus-visible:outline-offset-2",
          !onBrand &&
            "border-slate-300 bg-white group-hover:border-brand-400 dark:border-white/30 dark:bg-zinc-950 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand-600/40 peer-focus-visible:outline-offset-2 peer-checked:border-brand-600 peer-checked:bg-brand-600 dark:peer-checked:border-brand-500 dark:peer-checked:bg-brand-500"
        )}
        aria-hidden="true"
      >
        {checked ? (
          <FiCheck
            className={cn(
              "h-3.5 w-3.5 stroke-[3]",
              onBrand ? "text-brand-600" : "text-white"
            )}
            aria-hidden
          />
        ) : null}
      </span>
      <span className="leading-snug">{t("search.travelForWork")}</span>
    </label>
  );
}

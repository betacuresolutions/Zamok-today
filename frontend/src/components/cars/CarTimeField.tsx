"use client";

import { buildCarTimeOptions } from "@/lib/carSearch";
import { SearchScrollSelect } from "@/components/search/SearchScrollSelect";

const timeOptions = buildCarTimeOptions();

export function CarTimeField({
  label,
  value,
  onChange,
  className,
  layout,
  open,
  onOpenChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  layout?: "mobile" | "desktop";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SearchScrollSelect
      label={label}
      value={value}
      options={timeOptions}
      onChange={onChange}
      className={className}
      layout={layout}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

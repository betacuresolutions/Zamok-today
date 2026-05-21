"use client";

import {
  searchFieldLabelClass,
  searchFieldShell,
  searchFieldValueClass
} from "@/components/search/searchFieldStyles";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function BusLocationField({
  label,
  value,
  onChange,
  placeholder,
  className
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn(searchFieldShell, className)}>
      <div className={searchFieldLabelClass}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={searchFieldValueClass}
        placeholder={placeholder}
      />
    </div>
  );
}

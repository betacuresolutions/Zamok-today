/** Shared search bar field + button shells (flights / hotels / cars). */
export const searchBarFieldHeight = "h-[4.75rem]";

export const searchFieldShell = [
  "relative flex w-full flex-col justify-center overflow-visible rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10",
  "dark:bg-black dark:ring-white/15",
  searchBarFieldHeight
].join(" ");

export const searchFieldLabelClass = "shrink-0 text-xs font-medium leading-4 text-slate-500 dark:text-white/50";

export const searchFieldValueClass =
  "mt-1 h-5 w-full shrink-0 bg-transparent text-sm font-semibold leading-5 text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/35";

export const searchBtnClass = [
  "flex w-full items-center justify-center rounded-2xl bg-[#ff8021] px-4 py-3 text-sm font-semibold text-white shadow-sm transition",
  "hover:bg-[#f07310] active:bg-[#e56a0c] ring-1 ring-black/5 dark:ring-white/10",
  searchBarFieldHeight
].join(" ");

export const searchBarMaxWidthClass = "mx-auto w-full max-w-[1440px]";

/** Cars desktop grid: locations | dates | times (wide enough for one-line labels) | search button */
export const carsSearchGridClass =
  "relative hidden w-full gap-2 overflow-visible md:grid md:grid-cols-[minmax(0,1.06fr)_minmax(0,1.06fr)_minmax(0,1.42fr)_minmax(9.25rem,9.75rem)_minmax(9.25rem,9.75rem)_10.25rem] md:items-stretch";

/** Buses desktop grid: from | to | departure + quick dates | search button */
export const busesSearchGridClass =
  "relative hidden w-full gap-2 overflow-visible md:grid md:grid-cols-[minmax(0,1.06fr)_minmax(0,1.06fr)_minmax(0,1.28fr)_minmax(12.5rem,13.5rem)] md:items-stretch";

/** Ferries: from | to | departure–return period | passengers | search */
export const ferriesSearchGridClass =
  "relative hidden w-full gap-2 overflow-visible md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.55fr)_minmax(9rem,10.5rem)_minmax(11rem,12.25rem)] md:items-stretch";

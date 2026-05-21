/**
 * Primary header nav + insurance mega-menu — single source for Topbar and SiteFooter.
 * Use `#` for routes not yet implemented.
 */

/** Insurance mega-menu keys (order matches Topbar). */
export const INSURANCE_MENU_ITEM_KEYS = [
  "nav.insurance.item.comprehensiveCar",
  "nav.insurance.item.traffic",
  "nav.insurance.item.health",
  "nav.insurance.item.home",
  "nav.insurance.item.workplace",
  "nav.insurance.item.travel",
  "nav.insurance.item.dask",
  "nav.insurance.item.personalAccident",
  "nav.insurance.item.life",
  "nav.insurance.item.individualPension",
  "nav.insurance.item.supplementaryHealth",
  "nav.insurance.item.cargo",
  "nav.insurance.item.engineering",
  "nav.insurance.item.liability"
] as const;

export type InsuranceMenuKey = (typeof INSURANCE_MENU_ITEM_KEYS)[number];

/** Live insurance pages; others stay `#` until routes exist. */
export const INSURANCE_ITEM_HREF: Partial<Record<InsuranceMenuKey, string>> = {
  "nav.insurance.item.comprehensiveCar": "/insurance/comprehensive-car",
  "nav.insurance.item.traffic": "/insurance/motorbike",
  "nav.insurance.item.health": "/insurance/health",
  "nav.insurance.item.home": "/insurance/home",
  "nav.insurance.item.travel": "/insurance/travel",
  "nav.insurance.item.life": "/insurance/life",
  "nav.insurance.item.personalAccident": "/insurance/personal-accident",
  "nav.insurance.item.dask": "/insurance/dask",
  "nav.insurance.item.supplementaryHealth": "/insurance/supplementary-health"
};

/** Primary row in the header center (before Insurance). */
export const HEADER_CENTER_NAV: ReadonlyArray<{ href: string; labelKey: string }> = [
  { href: "/", labelKey: "tabs.flights" },
  { href: "/hotels", labelKey: "tabs.hotels" },
  { href: "/buses", labelKey: "nav.buses" },
  { href: "/ferries", labelKey: "nav.ferries" },
  { href: "/cars", labelKey: "nav.cars" }
];

/** Support pill uses the same placeholder until a route exists. */
export const HEADER_SUPPORT_NAV = { href: "#", labelKey: "topbar.support" } as const;

/** Footer “same as header”: center links + support (matches mobile drawer order). */
export const HEADER_FOOTER_NAV: ReadonlyArray<{ href: string; labelKey: string }> = [
  ...HEADER_CENTER_NAV,
  { href: "#", labelKey: "topbar.support" }
];

export function insuranceNavItems(): ReadonlyArray<{ href: string; labelKey: InsuranceMenuKey }> {
  return INSURANCE_MENU_ITEM_KEYS.map((key) => ({
    href: INSURANCE_ITEM_HREF[key] ?? "#",
    labelKey: key
  }));
}

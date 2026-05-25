import Script from "next/script";

const DEFAULT_SCRIPT_SRC = "https://tpembars.com/NTI1MTc2.js?t=525176";

function buildTravelpayoutsScriptSrc(): string {
  const base =
    process.env.NEXT_PUBLIC_TRAVELPAYOUTS_SCRIPT_SRC?.trim() || DEFAULT_SCRIPT_SRC;
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER?.trim();
  if (!marker) return base;
  const url = new URL(base);
  url.searchParams.set("marker", marker);
  return url.toString();
}

function shouldLoadTravelpayoutsScript(): boolean {
  if (process.env.NEXT_PUBLIC_TRAVELPAYOUTS_SCRIPT_DISABLED === "true") {
    return false;
  }
  if (process.env.NEXT_PUBLIC_TRAVELPAYOUTS_SCRIPT_ENABLED === "true") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

/** Travelpayouts link monetization; skipped in dev to avoid "config is not valid" console noise. */
export function TravelpayoutsScript() {
  if (!shouldLoadTravelpayoutsScript()) return null;

  const src = buildTravelpayoutsScriptSrc();

  return (
    <Script
      id="tpembars-loader"
      strategy="afterInteractive"
      data-noptimize="1"
      data-cfasync="false"
      data-wpfc-render="false"
      seraph-accel-crit="1"
      data-no-defer="1"
    >
      {`(function () {
      var script = document.createElement("script");
      script.async = 1;
      script.src = ${JSON.stringify(src)};
      document.head.appendChild(script);
  })();`}
    </Script>
  );
}

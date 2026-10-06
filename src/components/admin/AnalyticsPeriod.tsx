import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { getMarketingAnalytics } from "@/lib/analytics/analytics.functions";
import type { AnalyticsResult, PeriodKey } from "@/lib/analytics/metrics";

const PERIODS: { k: PeriodKey; l: string }[] = [
  { k: "today", l: "Today" }, { k: "7d", l: "7 days" }, { k: "30d", l: "30 days" }, { k: "mtd", l: "Month to date" }, { k: "custom", l: "Custom" },
];
export const tk = (n: number | null) => (n === null ? "—" : "৳" + n.toLocaleString("en-BD", { maximumFractionDigits: 2 }));
export const pct = (n: number | null) => (n === null ? "n/a" : `${n > 0 ? "+" : ""}${n}%`);

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Shared period picker + live analytics loader for marketing analytics pages. */
export function AnalyticsPeriod({ children }: { children: (d: AnalyticsResult) => React.ReactNode }) {
  const fetch = useServerFn(getMarketingAnalytics);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const ready = period !== "custom" || (start && end);
  const { data, error, isLoading } = useQuery({
    queryKey: ["mkt-analytics", period, start, end],
    enabled: Boolean(ready),
    queryFn: () => fetch({ data: { period, ...(period === "custom" ? { start, end } : {}) } }),
  });
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button key={p.k} onClick={() => setPeriod(p.k)} className={`rounded-full border border-border px-3 py-1 text-xs ${period === p.k ? "bg-primary text-primary-foreground" : ""}`}>{p.l}</button>
        ))}
        {period === "custom" && (
          <>
            <input type="date" aria-label="Start date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border border-border bg-background px-2 py-1" />
            <input type="date" aria-label="End date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border border-border bg-background px-2 py-1" />
          </>
        )}
      </div>
      {isLoading && <p className="text-muted-foreground">Calculating…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {data && (
        <>
          {children(data)}
          <p className="text-xs text-muted-foreground">Period (UTC): {data.period.current.start.slice(0, 10)} → {data.period.current.end.slice(0, 10)} (end exclusive). Cancelled orders excluded.</p>
        </>
      )}
    </div>
  );
}

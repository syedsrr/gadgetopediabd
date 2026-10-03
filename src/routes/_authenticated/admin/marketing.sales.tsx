import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { getMarketingAnalytics } from "@/lib/analytics/analytics.functions";
import type { PeriodKey } from "@/lib/analytics/metrics";

export const Route = createFileRoute("/_authenticated/admin/marketing/sales")({
  head: () => ({ meta: [{ title: "Sales analytics — Admin" }] }),
  component: SalesVerify,
});

const PERIODS: { k: PeriodKey; l: string }[] = [
  { k: "today", l: "Today" }, { k: "7d", l: "7 days" }, { k: "30d", l: "30 days" }, { k: "mtd", l: "Month to date" }, { k: "custom", l: "Custom" },
];
const tk = (n: number | null) => (n === null ? "—" : "৳" + n.toLocaleString("en-BD", { maximumFractionDigits: 2 }));
const pct = (n: number | null) => (n === null ? "n/a" : `${n > 0 ? "+" : ""}${n}%`);

function SalesVerify() {
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Revenue", tk(data.current.revenue), pct(data.growth.revenue)],
              ["Orders", String(data.current.orders), pct(data.growth.orders)],
              ["Units sold", String(data.current.units), pct(data.growth.units)],
              ["Avg order value", tk(data.current.aov), ""],
              ["Unique customers", String(data.customers.unique), ""],
              ["Repeat customers", String(data.customers.repeat), ""],
              ["Stock units", String(data.inventory.stockUnits), ""],
              ["Stock value (retail)", tk(data.inventory.stockValueAtRetail), "at cost: unavailable"],
            ].map(([l, v, s]) => (
              <div key={l} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="text-lg font-semibold">{v}</p>
                {s && <p className="text-xs text-muted-foreground">{s}</p>}
              </div>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {([["Products", data.products], ["Categories", data.categories]] as const).map(([t, rows]) => (
              <div key={t} className="rounded-xl border border-border bg-background p-3">
                <p className="mb-2 font-medium">{t}</p>
                {rows.length === 0 ? <p className="text-muted-foreground">No sales in this period.</p> : (
                  <ul className="space-y-1">{rows.slice(0, 10).map((r) => (
                    <li key={r.key} className="flex justify-between gap-2"><span className="truncate">{r.name}</span><span>{r.units} · {tk(r.revenue)}</span></li>
                  ))}</ul>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Period (UTC): {data.period.current.start.slice(0, 10)} → {data.period.current.end.slice(0, 10)} (end exclusive). Cancelled orders excluded.</p>
        </>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsPeriod, Stat, tk } from "@/components/admin/AnalyticsPeriod";

export const Route = createFileRoute("/_authenticated/admin/marketing/products")({
  head: () => ({ meta: [{ title: "Product analytics — Admin" }] }),
  component: () => (
    <AnalyticsPeriod>
      {(d) => {
        const total = d.current.revenue || 0;
        const share = (r: number) => (total ? `${Math.round((r / total) * 100)}%` : "—");
        return (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Products sold" value={String(d.products.length)} />
              <Stat label="Units sold" value={String(d.current.units)} />
              <Stat label="Active products" value={String(d.inventory.activeProducts)} />
              <Stat label="Stock value (retail)" value={tk(d.inventory.stockValueAtRetail)} sub={`${d.inventory.stockUnits} units in stock`} />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {([["Top products", d.products], ["Categories", d.categories]] as const).map(([t, rows]) => (
                <div key={t} className="rounded-xl border border-border bg-background p-3">
                  <p className="mb-2 font-medium">{t}</p>
                  {rows.length === 0 ? <p className="text-muted-foreground">No sales in this period.</p> : (
                    <ul className="space-y-1.5">{rows.slice(0, 15).map((r) => (
                      <li key={r.key} className="flex justify-between gap-2">
                        <span className="truncate">{r.name}</span>
                        <span className="shrink-0 text-muted-foreground">{r.units} units · <span className="text-foreground">{tk(r.revenue)}</span> · {share(r.revenue)}</span>
                      </li>
                    ))}</ul>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      }}
    </AnalyticsPeriod>
  ),
});

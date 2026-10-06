import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsPeriod, Stat, pct, tk } from "@/components/admin/AnalyticsPeriod";

export const Route = createFileRoute("/_authenticated/admin/marketing/sales")({
  head: () => ({ meta: [{ title: "Sales analytics — Admin" }] }),
  component: () => (
    <AnalyticsPeriod>
      {(d) => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Revenue" value={tk(d.current.revenue)} sub={`${pct(d.growth.revenue)} vs previous`} />
          <Stat label="Orders" value={String(d.current.orders)} sub={`${pct(d.growth.orders)} vs previous`} />
          <Stat label="Units sold" value={String(d.current.units)} sub={`${pct(d.growth.units)} vs previous`} />
          <Stat label="Avg order value" value={tk(d.current.aov)} sub={`Previous: ${tk(d.previous.aov)}`} />
          <Stat label="Previous revenue" value={tk(d.previous.revenue)} />
          <Stat label="Previous orders" value={String(d.previous.orders)} />
          <Stat label="Previous units" value={String(d.previous.units)} />
        </div>
      )}
    </AnalyticsPeriod>
  ),
});

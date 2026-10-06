import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsPeriod, Stat, tk } from "@/components/admin/AnalyticsPeriod";

export const Route = createFileRoute("/_authenticated/admin/marketing/customers")({
  head: () => ({ meta: [{ title: "Customer analytics — Admin" }] }),
  component: () => (
    <AnalyticsPeriod>
      {(d) => {
        const u = d.customers.unique;
        const r = d.customers.repeat;
        const perCustomer = u ? Math.round((d.current.revenue / u) * 100) / 100 : null;
        return (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Unique customers" value={String(u)} />
              <Stat label="Repeat customers" value={String(r)} sub="More than 1 order in this period" />
              <Stat label="Repeat rate" value={u ? `${Math.round((r / u) * 100)}%` : "—"} />
              <Stat label="Avg spend per customer" value={tk(perCustomer)} />
              <Stat label="One-time buyers" value={String(u - r)} />
              <Stat label="Orders per customer" value={u ? (d.current.orders / u).toFixed(2) : "—"} />
            </div>
            <p className="text-xs text-muted-foreground">Customers are matched by account or phone number. Only totals are shown — no personal details.</p>
          </>
        );
      }}
    </AnalyticsPeriod>
  ),
});

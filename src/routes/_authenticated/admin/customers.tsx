import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersPage,
});

type Row = {
  phone: string;
  name: string;
  area: string | null;
  orders: number;
  spent: number;
  last: string;
  member: boolean;
};

function CustomersPage() {
  const [search, setSearch] = useState("");
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_name, phone, area, total, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const map = new Map<string, Row>();
      for (const o of data ?? []) {
        const key = o.phone.replace(/\D/g, "").slice(-10);
        const r = map.get(key);
        const paid = o.status === "cancelled" ? 0 : Number(o.total);
        if (r) {
          r.orders++;
          r.spent += paid;
          r.member ||= !!o.user_id;
        } else {
          map.set(key, {
            phone: o.phone,
            name: o.customer_name,
            area: o.area,
            orders: 1,
            spent: paid,
            last: o.created_at,
            member: !!o.user_id,
          });
        }
      }
      return [...map.values()].sort((a, b) => b.spent - a.spent);
    },
  });

  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    return (data ?? []).filter(
      (r) => !t || r.name.toLowerCase().includes(t) || r.phone.includes(t),
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Everyone who ordered, grouped by phone — guests and members.
          </p>
        </div>
        <Input
          aria-label="Search customers"
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load customers.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Area</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Spent</th>
                <th className="p-3">Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.phone} className="border-t border-border">
                  <td className="p-3 font-medium">
                    {r.name}
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                      {r.member ? "Member" : "Guest"}
                    </span>
                  </td>
                  <td className="p-3">
                    <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a>
                  </td>
                  <td className="p-3">{r.area ?? "—"}</td>
                  <td className="p-3 text-right">{r.orders}</td>
                  <td className="p-3 text-right">৳{r.spent.toLocaleString("en-BD")}</td>
                  <td className="p-3">{new Date(r.last).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

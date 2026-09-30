import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Heart,
  PackagePlus,
  ShoppingBag,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, dashboardStatsQuery, DEFAULT_FILTERS } from "@/lib/adminCatalog";
import { formatBDT } from "@/lib/format";

type StockFilter = "in" | "low" | "out" | "soldout" | "preorder";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function Dashboard() {
  const { data: stats, isPending } = useQuery(dashboardStatsQuery);
  const lowStock = useQuery(
    adminProductsQuery({ ...DEFAULT_FILTERS, stock: "low", sort: "stock_asc", pageSize: 6 }),
  );
  const soldOut = useQuery(
    adminProductsQuery({ ...DEFAULT_FILTERS, stock: "soldout", sort: "name", pageSize: 6 }),
  );
  const preorder = useQuery(
    adminProductsQuery({ ...DEFAULT_FILTERS, stock: "preorder", sort: "name", pageSize: 6 }),
  );

  const orderStats = useQuery({
    queryKey: ["admin-order-status-breakdown"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("status, total, created_at");
      if (error) throw new Error(error.message);
      const counts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
      let revenue = 0;
      const rows = data ?? [];
      for (const o of rows) {
        counts[o.status] += 1;
        if (o.status !== "cancelled") revenue += Number(o.total);
      }

      // last 7 days revenue series
      const today = startOfDay(new Date());
      const series = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(today);
        day.setDate(today.getDate() - (6 - i));
        return { label: DAY_LABELS[day.getDay()], value: 0, date: day };
      });
      let last7 = 0;
      let prev7 = 0;
      for (const o of rows) {
        if (o.status === "cancelled") continue;
        const created = startOfDay(new Date(o.created_at));
        const diff = Math.round((today.getTime() - created.getTime()) / 86400000);
        if (diff >= 0 && diff <= 6) {
          const slot = series[6 - diff];
          if (slot) slot.value += Number(o.total);
          last7 += Number(o.total);
        } else if (diff >= 7 && diff <= 13) {
          prev7 += Number(o.total);
        }
      }

      return { counts, revenue, count: rows.length, series, last7, prev7 };
    },
  });

  const topProducts = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price");
      if (error) throw new Error(error.message);
      const map = new Map<string, { name: string; qty: number; revenue: number }>();
      for (const it of data ?? []) {
        const row = map.get(it.product_name) ?? { name: it.product_name, qty: 0, revenue: 0 };
        row.qty += it.quantity;
        row.revenue += it.quantity * Number(it.unit_price);
        map.set(it.product_name, row);
      }
      return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    },
  });

  const statusRows = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ] as const;

  const cards: { label: string; value: number | undefined; stock?: StockFilter }[] = [
    { label: "Total products", value: stats?.total },
    { label: "Published", value: stats?.published },
    { label: "Drafts", value: stats?.draft },
    { label: "Archived", value: stats?.archived },
  ];

  const total = stats?.total || 1;
  const tiles = [
    {
      label: "Published live",
      value: stats?.published ?? 0,
      pct: Math.round(((stats?.published ?? 0) / total) * 100),
      icon: ShoppingBag,
      bar: "bg-moss",
    },
    {
      label: "Pre-order",
      value: stats?.preorder ?? 0,
      pct: Math.round(((stats?.preorder ?? 0) / total) * 100),
      icon: Boxes,
      bar: "bg-canopy",
    },
    {
      label: "Low stock",
      value: stats?.lowStock ?? 0,
      pct: Math.round(((stats?.lowStock ?? 0) / total) * 100),
      icon: BarChart3,
      bar: "bg-amber-500",
    },
    {
      label: "Sold out",
      value: stats?.soldOut ?? 0,
      pct: Math.round(((stats?.soldOut ?? 0) / total) * 100),
      icon: Heart,
      bar: "bg-sale",
    },
  ];

  const delivered = orderStats.data?.counts.delivered ?? 0;
  const orderCount = orderStats.data?.count ?? 0;
  const fulfilRate = orderCount ? Math.round((delivered / orderCount) * 100) : 0;
  const last7 = orderStats.data?.last7 ?? 0;
  const prev7 = orderStats.data?.prev7 ?? 0;
  const delta = last7 - prev7;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Store dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your catalogue, stock and orders in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/admin/products/new">
              <PackagePlus className="mr-1.5 h-4 w-4" /> Add product
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/import">
              <Upload className="mr-1.5 h-4 w-4" /> Import CSV
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly sales trend */}
        <Card className="overflow-hidden">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sales this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderStats.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <p className="font-display text-3xl font-bold">{formatBDT(last7)}</p>
                <p
                  className={`text-sm font-semibold ${delta < 0 ? "text-sale" : "text-moss"}`}
                >
                  {delta >= 0 ? "+" : "−"}
                  {formatBDT(Math.abs(delta))} vs last week
                </p>
                <Sparkline points={(orderStats.data?.series ?? []).map((s) => s.value)} />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  {(orderStats.data?.series ?? []).map((s, i) => (
                    <span key={i}>{s.label}</span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Analytics panel */}
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderStats.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <p className="font-display text-3xl font-bold">
                  {formatBDT(orderStats.data?.revenue ?? 0)}
                </p>
                <div>
                  <div className="flex h-9 overflow-hidden rounded-xl bg-secondary">
                    <div
                      className="flex items-center justify-end rounded-xl bg-moss px-3 text-sm font-bold text-moss-foreground"
                      style={{ width: `${Math.max(fulfilRate, 12)}%` }}
                    >
                      {fulfilRate}%
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {delivered} of {orderCount} orders delivered
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                    <span>Best sellers</span>
                    <span className="text-right">Units</span>
                    <span className="text-right">Sales</span>
                  </div>
                  {topProducts.isPending ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (topProducts.data ?? []).length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">No sales yet.</p>
                  ) : (
                    (topProducts.data ?? []).map((p) => (
                      <div
                        key={p.name}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-border py-1.5 text-sm"
                      >
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="text-right font-semibold text-moss">+{p.qty}</span>
                        <span className="text-right font-semibold">{formatBDT(p.revenue)}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catalogue mix tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-3xl font-bold">
                    {isPending ? "–" : t.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.label}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
                  <t.icon className="h-4 w-4 text-moss" />
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold">{isPending ? "–" : `${t.pct}%`}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                <div
                  className={`h-1.5 rounded-full ${t.bar}`}
                  style={{ width: `${isPending ? 0 : Math.min(t.pct, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Donut: catalogue health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stock health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Donut
              total={stats?.total ?? 0}
              value={(stats?.total ?? 0) - (stats?.soldOut ?? 0)}
              loading={isPending}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {isPending
                ? "Loading…"
                : `${(stats?.total ?? 0) - (stats?.soldOut ?? 0)} in stock · ${stats?.soldOut ?? 0} sold out`}
            </p>
          </CardContent>
        </Card>

        {/* Order fulfilment */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Order fulfilment</CardTitle>
            <p className="text-sm text-muted-foreground">
              Order volume:{" "}
              <span className="font-semibold text-foreground">
                {orderStats.isPending ? "…" : formatBDT(orderStats.data?.revenue ?? 0)}
              </span>
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {statusRows.map((r) => {
              const n = orderStats.data?.counts[r.key] ?? 0;
              const denom = orderStats.data?.count || 1;
              return (
                <div key={r.key} className="rounded-xl border border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {r.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {orderStats.isPending ? "–" : n}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-moss"
                      style={{ width: `${Math.round((n / denom) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {c.label}
              </p>
              {isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-1 font-display text-3xl font-bold">{c.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StockList
          title="Running low"
          tone="low"
          rows={lowStock.data?.rows ?? []}
          loading={lowStock.isPending}
        />
        <StockList
          title="Sold out"
          tone="soldout"
          rows={soldOut.data?.rows ?? []}
          loading={soldOut.isPending}
        />
        <StockList
          title="Pre-order"
          tone="preorder"
          rows={preorder.data?.rows ?? []}
          loading={preorder.isPending}
        />
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 320;
  const h = 110;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((v, i) => [i * step, h - (v / max) * (h - 16) - 8] as const);
  const path = coords
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = coords[i - 1]!;
      const cx = (px + x) / 2;
      return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-28 w-full" preserveAspectRatio="none">
      <path
        d={`${path} L ${w} ${h} L 0 ${h} Z`}
        fill="color-mix(in oklab, var(--moss) 14%, transparent)"
      />
      <path
        d={path}
        fill="none"
        stroke="var(--moss)"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Donut({
  total,
  value,
  loading,
}: {
  total: number;
  value: number;
  loading: boolean;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-40 w-40 place-items-center">
      <svg viewBox="0 0 128 128" className="h-40 w-40 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--secondary)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="var(--moss)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(loading ? 0 : pct / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-xl font-bold">{loading ? "–" : `${pct}%`}</p>
        <p className="text-xs text-muted-foreground">{loading ? "" : `${total} items`}</p>
      </div>
    </div>
  );
}

function StockList({
  title,
  tone,
  rows,
  loading,
}: {
  title: string;
  tone: StockFilter;
  rows: { id: string; name: string; stock: number; price: number; slug: string }[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle
            className={tone === "soldout" ? "h-4 w-4 text-sale" : "h-4 w-4 text-moss"}
          />
          {title}
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/products" search={{ stock: tone }}>
            View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nothing to worry about here.</p>
        ) : (
          rows.map((p) => (
            <Link
              key={p.id}
              to="/admin/products/$id"
              params={{ id: p.id }}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-secondary"
            >
              <span className="truncate pr-3">{p.name}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-muted-foreground">{formatBDT(p.price)}</span>
                <Badge variant={p.stock <= 0 ? "destructive" : "secondary"}>{p.stock} left</Badge>
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

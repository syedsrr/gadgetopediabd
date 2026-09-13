import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, PackagePlus, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminProductsQuery, dashboardStatsQuery, DEFAULT_FILTERS } from "@/lib/adminCatalog";
import { formatBDT } from "@/lib/format";

type StockFilter = "in" | "low" | "out" | "soldout" | "preorder";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

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

  const cards: { label: string; value: number | undefined; stock?: StockFilter }[] = [
    { label: "Total products", value: stats?.total },
    { label: "Published", value: stats?.published },
    { label: "Drafts", value: stats?.draft },
    { label: "Archived", value: stats?.archived },
    { label: "Sold out", value: stats?.soldOut, stock: "soldout" },
    { label: "Pre-order", value: stats?.preorder, stock: "preorder" },
    { label: "Low stock", value: stats?.lowStock, stock: "low" },
    { label: "Orders", value: stats?.orders },
  ];

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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const body = (
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
          );
          return c.stock ? (
            <Link key={c.label} to="/admin/products" search={{ stock: c.stock }}>
              <Card className="h-full transition hover:border-moss">{body}</Card>
            </Link>
          ) : (
            <Card key={c.label}>{body}</Card>
          );
        })}
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
          <AlertTriangle className={tone === "out" ? "h-4 w-4 text-sale" : "h-4 w-4 text-moss"} />
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

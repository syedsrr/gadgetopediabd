import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Save, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminProductsQuery,
  DEFAULT_FILTERS,
  updateStock,
  type ProductFilters,
} from "@/lib/adminCatalog";
import { isPreorder, isSoldOut } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  component: InventoryManager,
});

function InventoryManager() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    sort: "stock_asc",
    pageSize: 50,
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isPending } = useQuery(adminProductsQuery(filters));
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  const update = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value, page: key === "page" ? (value as number) : 1 }));

  const changed = rows.filter(
    (p) => drafts[p.id] !== undefined && Number(drafts[p.id]) !== Number(p.stock),
  );

  const saveAll = useMutation({
    mutationFn: async () => {
      for (const p of changed) {
        const value = Number(drafts[p.id]);
        if (!Number.isInteger(value) || value < 0) throw new Error("Stock must be 0 or more");
        await updateStock(p.id, value);
      }
    },
    onSuccess: async () => {
      toast.success(`Stock saved for ${changed.length} product${changed.length === 1 ? "" : "s"}`);
      setDrafts({});
      await queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {total} item{total === 1 ? "" : "s"} · lowest stock first
          </p>
        </div>
        <Button disabled={changed.length === 0 || saveAll.isPending} onClick={() => saveAll.mutate()}>
          <Save className="mr-1.5 h-4 w-4" />
          {saveAll.isPending
            ? "Saving…"
            : changed.length
              ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}`
              : "No changes"}
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              placeholder="Search by name, SKU or brand"
              className="pl-9 pr-9"
            />
            {filters.search && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => update("search", "")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select
            value={filters.stock}
            onValueChange={(v) => update("stock", v as ProductFilters["stock"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any stock</SelectItem>
              <SelectItem value="in">In stock</SelectItem>
              <SelectItem value="low">Low stock (1–5)</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
              <SelectItem value="soldout">Sold out (not buyable)</SelectItem>
              <SelectItem value="preorder">Pre-order</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">In stock</TableHead>
                  <TableHead className="w-24">Low at</TableHead>
                  <TableHead className="text-right">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm">
                      <p className="text-muted-foreground">No products match these filters.</p>
                      <Button
                        variant="secondary"
                        className="mt-3"
                        onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: "stock_asc", pageSize: 50 })}
                      >
                        Reset filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((p) => {
                    const stock = Number(p.stock ?? 0);
                    const low = Number(p.low_stock_threshold ?? 5);
                    const tone =
                      stock <= 0
                        ? "text-sale font-semibold"
                        : stock <= low
                          ? "text-moss font-semibold"
                          : "";
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.sku ?? "no SKU"} · {p.categories?.name ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {stock <= 0 && !isPreorder(p) && (
                              <Badge variant="destructive">Out of stock</Badge>
                            )}
                            {stock > 0 && stock <= low && <Badge variant="outline">Low</Badge>}
                            {isPreorder(p) && <Badge variant="outline">Pre-order</Badge>}
                            {isSoldOut(p) && <Badge variant="destructive">Sold out</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className={tone}>{stock}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{low}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              className="h-9 w-20"
                              inputMode="numeric"
                              value={drafts[p.id] ?? String(stock)}
                              onChange={(e) =>
                                setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                              }
                            />
                            <Button asChild size="sm" variant="ghost">
                              <Link to="/admin/products/$id" params={{ id: p.id }}>
                                Open
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 text-sm">
        <span className="text-muted-foreground">
          Page {filters.page} of {pages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={filters.page <= 1}
          onClick={() => update("page", filters.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={filters.page >= pages}
          onClick={() => update("page", filters.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

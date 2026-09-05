import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Copy,
  ExternalLink,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  adminBrandsQuery,
  adminCategoriesQuery,
  adminProductsQuery,
  DEFAULT_FILTERS,
  deleteOrArchiveProduct,
  duplicateProduct,
  updateStock,
  type ProductFilters,
} from "@/lib/adminCatalog";
import { formatBDT, priceInfo } from "@/lib/format";

type Search = { stock?: "all" | "in" | "low" | "out" };

export const Route = createFileRoute("/_authenticated/admin/products/")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const value = search["stock"];
    return {
      stock: value === "in" || value === "low" || value === "out" ? value : "all",
    };
  },
  component: ProductsAdmin,
});


function ProductsAdmin() {
  const { stock } = Route.useSearch();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    stock: stock ?? "all",
  });
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});

  const { data, isPending, isFetching } = useQuery(adminProductsQuery(filters));
  const { data: categories = [] } = useQuery(adminCategoriesQuery);
  const { data: brands = [] } = useQuery(adminBrandsQuery);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  const update = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value, page: key === "page" ? (value as number) : 1 }));

  const invalidate = () => queryClient.invalidateQueries();

  const saveStock = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => updateStock(id, value),
    onSuccess: () => {
      toast.success("Stock updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => duplicateProduct(id),
    onSuccess: () => {
      toast.success("Copy created as a draft");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteOrArchiveProduct(id),
    onSuccess: (result) => {
      toast.success(
        result === "deleted"
          ? "Product deleted"
          : "Product archived — it appears in past orders, so it was hidden instead of deleted",
      );
      setPendingDelete(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total} item{total === 1 ? "" : "s"} in your catalogue
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <PackagePlus className="mr-1.5 h-4 w-4" /> Add product
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              placeholder="Search by name, SKU, brand or category"
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

          <Select value={filters.categoryId} onValueChange={(v) => update("categoryId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.brand} onValueChange={(v) => update("brand", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) => update("status", v as ProductFilters["status"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

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
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(v) => update("sort", v as ProductFilters["sort"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="recent">Newest first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="price_asc">Price low → high</SelectItem>
              <SelectItem value="price_desc">Price high → low</SelectItem>
              <SelectItem value="stock_asc">Lowest stock first</SelectItem>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-28">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        No products match these filters.
                      </p>
                      <Button
                        variant="secondary"
                        className="mt-3"
                        onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                      >
                        Reset filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((p) => {
                    const info = priceInfo(p);
                    return (
                      <TableRow key={p.id} className={isFetching ? "opacity-70" : undefined}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="h-11 w-11 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-11 w-11 rounded-lg bg-secondary" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.sku ?? "no SKU"} · {p.brand ?? "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.categories?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold">{formatBDT(info.selling)}</span>
                          {info.onSale && (
                            <span className="ml-1.5 text-xs text-muted-foreground line-through">
                              {formatBDT(p.price)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-9 w-20"
                            inputMode="numeric"
                            value={stockDraft[p.id] ?? String(p.stock)}
                            onChange={(e) =>
                              setStockDraft((d) => ({ ...d, [p.id]: e.target.value }))
                            }
                            onBlur={(e) => {
                              const value = Number(e.target.value);
                              if (!Number.isInteger(value) || value < 0) {
                                toast.error("Stock must be 0 or more");
                                setStockDraft((d) => ({ ...d, [p.id]: String(p.stock) }));
                                return;
                              }
                              if (value !== p.stock) saveStock.mutate({ id: p.id, value });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "published"
                                ? "default"
                                : p.status === "draft"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button asChild size="icon" variant="ghost" aria-label="Edit">
                              <Link to="/admin/products/$id" params={{ id: p.id }}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Duplicate"
                              disabled={duplicate.isPending}
                              onClick={() => duplicate.mutate(p.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button asChild size="icon" variant="ghost" aria-label="View in store">
                              <Link to="/product/$slug" params={{ slug: p.slug }} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Delete"
                              onClick={() => setPendingDelete({ id: p.id, name: p.name })}
                            >
                              <Trash2 className="h-4 w-4 text-sale" />
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select
            value={String(filters.pageSize)}
            onValueChange={(v) => update("pageSize", Number(v))}
          >
            <SelectTrigger className="h-9 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-sm">
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

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product from your store. If it appears in past orders it will be
              archived and hidden instead, so your order history stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
              disabled={remove.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

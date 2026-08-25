import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw, Search, Weight, X } from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop all gadgets — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "Browse every gadget and lifestyle product in stock: smart watches, earbuds, power banks, chargers and home upgrades.",
      },
      { property: "og:title", content: "Shop all gadgets — gadgetOpedia n' Lifestyle" },
      {
        property: "og:description",
        content: "Browse every gadget and lifestyle product in stock at gadgetOpedia n' Lifestyle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

type ProductRecord = {
  id: string;
  slug: string;
  name: string | null;
  image_url: string | null;
  title: string | null;
  category: string | null;
  weight_kg: number | null;
  manufacturer: string | null;
  specs_description: string | null;
  created_at: string;
};

const categoryStyles: Record<string, string> = {
  "Smart Watches": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Earbuds & Audio": "bg-lime-100 text-lime-800 border-lime-200",
  "Power & Charging": "bg-teal-100 text-teal-800 border-teal-200",
  "Phone Accessories": "bg-green-100 text-green-800 border-green-200",
  "Home & Kitchen": "bg-amber-100 text-amber-800 border-amber-200",
  "Lifestyle & Fitness": "bg-cyan-100 text-cyan-800 border-cyan-200",
};

function useProducts() {
  return useQuery({
    queryKey: ["products", "spec-records"],
    queryFn: async (): Promise<ProductRecord[]> => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as ProductRecord[];
    },
  });
}

function ProductSkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

function ProductSkeletonGrid() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <ProductSkeletonCard key={i} />
      ))}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-b-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function SpecsSheet({
  product,
  open,
  onOpenChange,
}: {
  product: ProductRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-display text-xl">{product.title ?? "Product"}</SheetTitle>
          <SheetDescription>Full technical specifications and details.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Button className="w-full" asChild>
            <Link to="/product/$slug" params={{ slug: product.slug }}>
              Open full product page
            </Link>
          </Button>
          <div className="rounded-xl border bg-card p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick info
            </h4>
            <div className="divide-y divide-border/60">
              <SpecRow label="Manufacturer" value={product.manufacturer} />
              <SpecRow label="Category" value={product.category} />
              <SpecRow
                label="Gross weight"
                value={
                  product.weight_kg != null ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Weight className="h-3.5 w-3.5 text-moss" />
                      {product.weight_kg.toFixed(2)} kg
                    </span>
                  ) : (
                    "Not specified"
                  )
                }
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Specifications & details
            </h4>
            {product.specs_description ? (
              <p className="text-sm leading-relaxed text-foreground">
                {product.specs_description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No detailed specifications available.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Shop() {
  const { data: products, isPending, error, refetch } = useProducts();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<ProductRecord | null>(null);

  const term = search.trim().toLowerCase();

  const categories = useMemo(() => {
    const set = new Set<string>();
    (products ?? []).forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      const matchesTerm = term
        ? (p.title ?? "").toLowerCase().includes(term) ||
          (p.manufacturer ?? "").toLowerCase().includes(term) ||
          (p.specs_description ?? "").toLowerCase().includes(term) ||
          (p.category ?? "").toLowerCase().includes(term)
        : true;
      return matchesCategory && matchesTerm;
    });
  }, [products, activeCategory, term]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products?.length ?? 0 };
    categories.forEach((c) => {
      counts[c] = (products ?? []).filter((p) => p.category === c).length;
    });
    return counts;
  }, [products, categories]);

  const pills = ["all", ...categories];

  const isEmpty = !isPending && filtered.length === 0;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <span className="eyebrow text-moss">Catalogue</span>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {term ? `Results for “${search.trim()}”` : "All products"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPending ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="bg-card pl-9"
            />
          </div>
        </div>

        {/* Category filter pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {pills.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === c
                  ? "border-transparent bg-canopy text-canopy-foreground"
                  : "border-border bg-card text-foreground/70 hover:border-moss hover:text-moss",
              )}
            >
              {c === "all" ? "All products" : c}
            </button>
          ))}
        </div>

        {isPending ? (
          <ProductSkeletonGrid />
        ) : error ? (
          <div className="mt-14 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load the catalogue right now.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="mt-14 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing matched your filters. Try a different keyword or category.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="flex flex-col overflow-hidden card-hover">
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="block aspect-[4/3] w-full overflow-hidden bg-muted"
                  aria-label={`View ${p.title ?? p.name ?? "product"} details`}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title ?? p.name ?? "Product"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {p.title ?? p.name ?? "Product"}
                    </span>
                  )}
                </Link>
                <CardHeader className="flex-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "w-fit",
                      categoryStyles[p.category ?? ""] ??
                        "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {p.category ?? "Uncategorized"}
                  </Badge>
                  <CardTitle className="mt-2 line-clamp-2 text-lg">
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="transition-colors hover:text-moss"
                    >
                      {p.title ?? p.name ?? "Untitled product"}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {p.manufacturer ? `By ${p.manufacturer}` : "Manufacturer unavailable"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Weight className="h-4 w-4 text-moss" />
                    <span>
                      {p.weight_kg != null ? `${p.weight_kg.toFixed(2)} kg` : "Weight N/A"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto flex flex-col gap-2 pt-0">
                  <Button className="w-full" asChild>
                    <Link to="/product/$slug" params={{ slug: p.slug }}>
                      View product page
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelected(p)}
                  >
                    Quick specifications
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SpecsSheet
        product={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </SiteLayout>
  );
}

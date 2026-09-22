import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw, Search, X } from "lucide-react";

import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/ProductGridSkeleton";
import { ProductSpecsDrawer } from "@/components/site/ProductSpecsDrawer";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  categoriesQuery,
  productsQuery,
  withCategories,
  type ProductWithCategory,
} from "@/lib/catalog";
import { isPreorder } from "@/lib/format";
import { cn } from "@/lib/utils";

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

function Shop() {
  const productsQueryResult = useQuery(productsQuery);
  const categoriesQueryResult = useQuery(categoriesQuery);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const products = useMemo(
    () => withCategories(productsQueryResult.data ?? [], categoriesQueryResult.data ?? []),
    [productsQueryResult.data, categoriesQueryResult.data],
  );
  const term = search.trim().toLowerCase();
  const categoryNames = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.categories?.name ?? product.category)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort(),
    [products],
  );
  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const category = product.categories?.name ?? product.category ?? "";
        const searchable = [
          product.name,
          product.title,
          product.brand,
          product.manufacturer,
          product.short_description,
          product.description,
          product.specs_description,
          category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (activeCategory === "all" || category === activeCategory) &&
          (!term || searchable.includes(term)) &&
          (!inStockOnly || Number(product.stock) > 0 || isPreorder(product))
        );
      }),
    [products, activeCategory, term, inStockOnly],
  );
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: products.length };
    for (const category of categoryNames) {
      result[category] = products.filter(
        (product) => (product.categories?.name ?? product.category) === category,
      ).length;
    }
    return result;
  }, [products, categoryNames]);
  const isPending = productsQueryResult.isPending || categoriesQueryResult.isPending;
  const error = productsQueryResult.error || categoriesQueryResult.error;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
        <span className="eyebrow text-moss">Catalogue</span>
        <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
              {term ? `Results for “${search.trim()}”` : "All products"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPending ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        <div className="sticky top-[4.05rem] z-30 -mx-4 mt-5 border-y border-border/70 bg-background/95 px-4 py-3 backdrop-blur-lg sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <div className="relative w-full sm:mt-5 sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products…"
              aria-label="Search catalogue"
              className="h-11 bg-card pl-9 pr-11"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearch("")}
                className="absolute right-0 top-1/2 h-11 w-11 -translate-y-1/2"
                aria-label="Clear catalogue search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="-mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-2 pb-1">
              {["all", ...categoryNames].map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "h-10 rounded-full px-3 text-xs",
                    activeCategory === category && "bg-canopy text-canopy-foreground hover:bg-canopy/90",
                  )}
                >
                  {category === "all" ? "All" : category}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.65rem]",
                      activeCategory === category
                        ? "bg-canopy-foreground/20 text-canopy-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {counts[category] ?? 0}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant={inStockOnly ? "default" : "outline"}
              aria-pressed={inStockOnly}
              onClick={() => setInStockOnly((value) => !value)}
              className="h-10 shrink-0 rounded-full px-3 text-xs"
            >
              In stock only
            </Button>
            <Link
              to="/sold-out"
              className="truncate text-xs font-medium text-muted-foreground underline-offset-4 hover:text-moss hover:underline sm:text-sm"
            >
              See sold out items
            </Link>
          </div>
        </div>

        {isPending ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">We couldn&apos;t load the catalogue right now.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                productsQueryResult.refetch();
                categoriesQueryResult.refetch();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="font-medium">No products found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try another keyword or category.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
                setInStockOnly(false);
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={setSelected} />
            ))}
          </div>
        )}
      </div>

      <ProductSpecsDrawer
        product={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </SiteLayout>
  );
}
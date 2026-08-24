import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/ProductGridSkeleton";
import { ProductSpecsDrawer } from "@/components/site/ProductSpecsDrawer";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { categoriesQuery, productsQuery, withCategories, type ProductWithCategory } from "@/lib/catalog";

type ShopSearch = { q?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch =>
    typeof search['q'] === "string" && search['q'] ? { q: search['q'] } : {},
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
    ],
  }),
  component: Shop,
});

function Shop() {
  const { q } = Route.useSearch();
  const { data: products = [], isPending } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [sort, setSort] = useState("new");
  const [search, setSearch] = useState(q ?? "");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);

  const term = search.trim().toLowerCase();

  const list = useMemo(() => {
    const withCats = withCategories(products, categories);
    const filtered = withCats.filter((p) => {
      const matchesCategory =
        activeCategory === "all" || p.categories?.slug === activeCategory;
      const matchesTerm = term
        ? p.name.toLowerCase().includes(term) ||
          (p.brand ?? "").toLowerCase().includes(term) ||
          (p.short_description ?? "").toLowerCase().includes(term)
        : true;
      return matchesCategory && matchesTerm;
    });

    return filtered.sort((a, b) => {
      if (sort === "low") return Number(a.price) - Number(b.price);
      if (sort === "high") return Number(b.price) - Number(a.price);
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, categories, activeCategory, term, sort]);

  const pills = [{ slug: "all", name: "All products" }, ...categories];

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
              {isPending ? "Loading…" : `${list.length} product${list.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="bg-card pl-9"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Newest first</SelectItem>
                <SelectItem value="low">Price: low to high</SelectItem>
                <SelectItem value="high">Price: high to low</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {pills.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setActiveCategory(c.slug)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === c.slug
                  ? "border-transparent bg-canopy text-canopy-foreground"
                  : "border-border bg-card text-foreground/70 hover:border-moss hover:text-moss",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {isPending ? (
          <ProductGridSkeleton />
        ) : list.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted-foreground">
            Nothing matched your filters. Try a different keyword or category.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setSelected} />
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

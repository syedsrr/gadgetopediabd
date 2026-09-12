import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageX, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/ProductGridSkeleton";
import { ProductSpecsDrawer } from "@/components/site/ProductSpecsDrawer";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductWithCategory } from "@/lib/catalog";
import { categoriesQuery, productsQuery, withCategories } from "@/lib/catalog";
import { isSoldOut } from "@/lib/format";

const TITLE = "Sold Out Products | gadgetOpedia n' Lifestyle";
const DESCRIPTION =
  "See which gadgets and lifestyle products are sold out right now, and browse the alternatives we still have ready to ship across Bangladesh.";
const URL = "https://www.gadgetopedia.shop/sold-out";

export const Route = createFileRoute("/sold-out")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: SoldOutPage,
});

function SoldOutPage() {
  const { data: products = [], isPending: productsPending } = useQuery(productsQuery);
  const { data: categories = [], isPending: categoriesPending } = useQuery(categoriesQuery);
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();

  const items = useMemo(() => {
    const list = withCategories(products, categories).filter((p) => isSoldOut(p));
    if (!term) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.brand ?? "").toLowerCase().includes(term) ||
        (p.categories?.name ?? "").toLowerCase().includes(term),
    );
  }, [products, categories, term]);

  const isPending = productsPending || categoriesPending;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <span className="eyebrow text-moss">Currently unavailable</span>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Sold out</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              These items are out of stock for now. Restocks happen regularly — check back soon or
              message us and we will let you know when they land.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sold out items…"
              aria-label="Search sold out products"
              className="bg-card pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-8">
          {isPending ? (
            <ProductGridSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
              <PackageX className="mx-auto h-8 w-8 text-moss" aria-hidden="true" />
              <h2 className="mt-3 font-display text-xl font-bold">
                {term ? "Nothing matched that search" : "Everything is in stock"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {term
                  ? "Try a different keyword."
                  : "Good news — every product in the catalogue is available right now."}
              </p>
              <Button className="mt-6" asChild>
                <Link to="/shop">Browse the shop</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setSelected} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductSpecsDrawer
        product={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </SiteLayout>
  );
}

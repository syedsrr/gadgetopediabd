import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/ProductGridSkeleton";
import { ProductSpecsDrawer } from "@/components/site/ProductSpecsDrawer";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import type { ProductWithCategory } from "@/lib/catalog";
import { categoriesQuery, productsQuery, withCategories } from "@/lib/catalog";
import { isPreorder } from "@/lib/format";

const TITLE = "Pre-order Upcoming Gadgets | gadgetOpedia n' Lifestyle";
const DESCRIPTION =
  "Reserve upcoming gadgets and lifestyle gear before they land in stock. Pay on delivery across Bangladesh with genuine product guarantee.";
const URL = "https://www.gadgetopedia.shop/pre-order";

export const Route = createFileRoute("/pre-order")({
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
  component: PreOrderPage,
});

function PreOrderPage() {
  const { data: products = [], isPending: productsPending } = useQuery(productsQuery);
  const { data: categories = [], isPending: categoriesPending } = useQuery(categoriesQuery);
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);

  const items = useMemo(() => {
    const list = withCategories(products, categories).filter((p) => isPreorder(p));
    return list.sort((a, b) => {
      const ad = a.preorder_release_date ?? "9999-12-31";
      const bd = b.preorder_release_date ?? "9999-12-31";
      return ad.localeCompare(bd);
    });
  }, [products, categories]);

  const isPending = productsPending || categoriesPending;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <span className="eyebrow text-moss">Coming soon</span>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Pre-order</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Reserve the next drop today. We confirm your order, keep your unit aside, and deliver it
          as soon as it reaches our warehouse.
        </p>

        <div className="mt-8">
          {isPending ? (
            <ProductGridSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
              <CalendarClock className="mx-auto h-8 w-8 text-moss" aria-hidden="true" />
              <h2 className="mt-3 font-display text-xl font-bold">No pre-orders right now</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Everything in the catalogue is ready to ship today.
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

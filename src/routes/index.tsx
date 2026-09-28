import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Truck,
  ShieldCheck,
  ArrowRight,
  Fan,
  BatteryCharging,
  Sparkles,
  Cable,
  UtensilsCrossed,
  Headphones,
  Watch,
  Lightbulb,
  Package,
} from "lucide-react";
import { useState } from "react";

import { ProductCard } from "@/components/site/ProductCard";
import { ProductSpecsDrawer } from "@/components/site/ProductSpecsDrawer";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery, withCategories } from "@/lib/catalog";
import { isPreorder, isSoldOut } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "gadgetOpedia n' Lifestyle — Gadgets & Lifestyle Store in BD" },
      {
        name: "description",
        content:
          "Shop smart watches, earbuds, power banks and lifestyle gear at gadgetOpedia n' Lifestyle. Genuine products, cash on delivery across Bangladesh.",
      },
      {
        property: "og:title",
        content: "gadgetOpedia n' Lifestyle — Gadgets & Lifestyle Store in BD",
      },
      {
        property: "og:description",
        content: "Curated gadgets and lifestyle upgrades, delivered across Bangladesh.",
      },
      { property: "og:url", content: "https://www.gadgetopedia.shop/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://www.gadgetopedia.shop/" },
      {
        rel: "preload",
        as: "image",
        href: "/images/hero.webp",
        type: "image/webp",
        fetchpriority: "high",
      },
    ],
  }),
  component: Home,
});

const CATEGORY_ICON_RULES: Array<[RegExp, typeof Package]> = [
  [/fan|cool/, Fan],
  [/power|battery|charg/, BatteryCharging],
  [/decor|collect|gift/, Sparkles],
  [/cable|accessor/, Cable],
  [/knife|knives|cutlery|kitchen/, UtensilsCrossed],
  [/earbud|headphone|audio|speaker/, Headphones],
  [/watch|wearable/, Watch],
  [/light|lamp|bulb/, Lightbulb],
];

function categoryIcon(slug: string, name: string) {
  const key = `${slug} ${name}`.toLowerCase();
  return CATEGORY_ICON_RULES.find(([re]) => re.test(key))?.[1] ?? Package;
}

function Home() {
  const { data: products = [], isPending: productsPending } = useQuery(productsQuery);
  const { data: categories = [], isPending: categoriesPending } = useQuery(categoriesQuery);
  const liveProducts = withCategories(products, categories);
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);
  const featured = liveProducts.filter((p) => p.is_featured);
  const latest = liveProducts.slice(0, 12);
  const preorders = liveProducts.filter((p) => isPreorder(p)).slice(0, 8);
  const soldOut = liveProducts.filter((p) => isSoldOut(p)).slice(0, 8);
  const isPending = productsPending || categoriesPending;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-canopy text-canopy-foreground">
        <picture>
          <source srcSet="/images/hero.webp" type="image/webp" />
          <img
            src="/images/hero.jpg"
            alt="Gadgets and lifestyle accessories arranged on a green backdrop"
            width={1600}
            height={907}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        </picture>
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="eyebrow text-accent">Gadgets · Audio · Lifestyle</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Everyday tech that
              <span className="text-accent"> feels good</span> to own.
            </h1>
            <p className="mt-5 max-w-xl text-base text-canopy-foreground/80">
              Handpicked smart watches, earbuds, chargers and home upgrades — genuine stock,
              honest prices, and cash on delivery anywhere in Bangladesh.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/shop">
                  Shop all products <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-canopy-foreground/30 bg-transparent text-canopy-foreground hover:bg-canopy-foreground/10">
                <Link to="/about">Our story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-5 sm:py-6">
          <ul className="grid grid-cols-3 divide-x divide-border/60">
            {[
              { icon: Truck, title: "Fast delivery", text: "Inside Dhaka in 24–48 hours" },
              { icon: BadgeCheck, title: "100% genuine", text: "Sourced from official channels" },
              { icon: ShieldCheck, title: "Warranty backed", text: "Easy replacement support" },
            ].map((f) => (
              <li
                key={f.title}
                className="flex flex-col items-center gap-1.5 px-1.5 text-center sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:text-left lg:px-6"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-moss/10 sm:h-10 sm:w-10">
                  <f.icon className="h-4 w-4 text-moss sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-center text-[11px] font-semibold leading-tight text-foreground max-[359px]:text-[10px] sm:text-left sm:text-sm">
                    {f.title}
                  </p>
                  <p className="mt-0.5 text-center text-[9.5px] leading-snug text-muted-foreground sm:text-left sm:text-xs">
                    {f.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-5 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow text-moss">Browse</span>
            <h2 className="mt-1 font-display text-xl font-bold sm:text-3xl">Shop by category</h2>
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link to="/shop">All products</Link>
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {categories.map((c) => {
            const Icon = categoryIcon(c.slug, c.name);
            const count = liveProducts.filter((p) => p.categories?.slug === c.slug).length;
            return (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="card-hover group flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-soft transition-colors hover:border-moss/50 sm:flex-col sm:items-start sm:gap-3 sm:rounded-2xl sm:p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-moss/10 text-moss transition-colors group-hover:bg-moss/15 sm:h-11 sm:w-11 sm:rounded-xl">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-left font-display text-[11px] font-semibold leading-tight text-foreground sm:text-sm">
                    {c.name}
                  </p>
                  <p className="mt-1 text-left text-[10px] leading-none text-muted-foreground sm:text-xs">
                    {count} {count === 1 ? "item" : "items"}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-moss transition-transform group-hover:translate-x-0.5 sm:hidden" />
                <span className="mt-1 hidden items-center text-xs font-medium text-moss sm:inline-flex">
                  Explore
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>


      {/* Pre-order — first product row so upcoming drops lead the page */}
      {preorders.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-moss">Coming soon</span>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Pre-order now</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Reserve the next drop and we ship it the moment it lands.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/pre-order">View all</Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {preorders.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setSelected} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-moss">Handpicked</span>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Featured picks</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/shop">View all</Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setSelected} />
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <span className="eyebrow text-moss">Fresh in</span>
        <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">New arrivals</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} onQuickView={setSelected} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button size="lg" asChild>
            <Link to="/shop">
              Browse all products <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      {/* Sold out */}
      {soldOut.length > 0 && (
        <section className="mx-auto max-w-6xl border-t border-border px-5 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-moss">Currently unavailable</span>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Sold out</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                These favourites ran out. Restocks land often — keep an eye on this list.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/sold-out">View all</Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {soldOut.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setSelected} />
            ))}
          </div>
        </section>
      )}

      <ProductSpecsDrawer
        product={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </SiteLayout>
  );
}

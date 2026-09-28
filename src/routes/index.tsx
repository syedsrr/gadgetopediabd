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
import { useRef, useState } from "react";

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

const CATEGORY_COVER_IMAGES: Record<string, string> = {
  "knives-cutlery": "/images/cat-knives-cutlery.jpg",
  "decorative-collectibles": "/images/cat-decorative-collectibles.jpg",
  "fans-cooling": "/images/cat-fans-cooling.jpg",
  "power-bank": "/images/cat-power-bank.jpg",
  "accessories-cables": "/images/cat-accessories-cables.jpg",
};

const CATEGORY_TAGS: Record<string, string> = {
  "knives-cutlery": "Field essentials",
  "decorative-collectibles": "Rare finds",
  "fans-cooling": "Cool comfort",
  "power-bank": "Stay charged",
  "accessories-cables": "Connection kits",
};

function categoryIcon(slug: string, name: string) {
  const key = `${slug} ${name}`.toLowerCase();
  return CATEGORY_ICON_RULES.find(([re]) => re.test(key))?.[1] ?? Package;
}

function Home() {
  const { data: products = [], isPending: productsPending } = useQuery(productsQuery);
  const { data: categories = [], isPending: categoriesPending } = useQuery(categoriesQuery);
  const liveProducts = withCategories(products, categories);
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeCategoryDot, setActiveCategoryDot] = useState(0);
  const onStripScroll = () => {
    const el = stripRef.current;
    if (!el || categories.length < 2) return;
    const max = el.scrollWidth - el.clientWidth;
    const idx =
      max <= 0
        ? 0
        : Math.min(
            categories.length - 1,
            Math.round((el.scrollLeft / max) * (categories.length - 1)),
          );
    setActiveCategoryDot(idx);
  };
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);
  const allFeatured = liveProducts.filter((p) => p.is_featured);
  const featured = showAllFeatured ? allFeatured.slice(0, 12) : allFeatured.slice(0, 6);
  const allLatest = liveProducts.slice(0, 12);
  const latest = showAllLatest ? allLatest : allLatest.slice(0, 6);
  const preorders = liveProducts.filter((p) => isPreorder(p)).slice(0, 4);
  const soldOut = liveProducts.filter((p) => isSoldOut(p)).slice(0, 4);
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
        <div className="relative mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:gap-8 sm:py-12 lg:py-16">
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
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-5 sm:py-4">
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
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-moss/10 sm:h-8 sm:w-8">
                  <f.icon className="h-3.5 w-3.5 text-moss sm:h-4 sm:w-4" />
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

      {/* Categories — side-by-side arched editorial strip */}
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-5 sm:py-7">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="eyebrow text-moss">Browse</span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Shop by category
            </h2>
          </div>
          <div className="hidden shrink-0 items-center gap-2 pb-1.5 sm:flex" aria-hidden="true">
            <span className="h-[2px] w-10 bg-foreground" />
            <span className="h-2 w-2 rounded-full border border-foreground" />
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0 sm:hidden">
            <Link to="/shop">All products</Link>
          </Button>
        </div>
        <div
          ref={stripRef}
          onScroll={onStripScroll}
          className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:mt-4 sm:gap-4 sm:px-5"
        >
          {categories.map((c) => {
            const cover = CATEGORY_COVER_IMAGES[c.slug];
            const Icon = categoryIcon(c.slug, c.name);
            const count = liveProducts.filter((p) => p.categories?.slug === c.slug).length;
            return (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="group flex-none w-[46vw] max-w-[190px] snap-start sm:w-[210px] lg:w-[calc((100%-4rem)/5)]"
              >
                <div className="relative overflow-hidden rounded-t-[999px] rounded-b-2xl bg-moss/10 sm:rounded-b-3xl">
                  <div className="aspect-[4/5] w-full">
                    {cover ? (
                      <img
                        src={cover}
                        alt={`${c.name} collection`}
                        width={800}
                        height={1067}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-moss">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </span>
                    )}
                  </div>
                  <div className="absolute left-3 top-6 rounded-full border border-canopy-foreground/25 bg-canopy/85 px-2.5 py-1 backdrop-blur-md sm:left-4 sm:top-8">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-canopy-foreground sm:text-[10px]">
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>
                <h3 className="mt-2 font-display text-xs font-bold leading-tight text-foreground sm:text-base lg:text-lg">
                  {c.name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-px w-4 shrink-0 bg-moss" aria-hidden="true" />
                  <span className="text-[9px] font-medium uppercase tracking-wider text-moss sm:text-[10px]">
                    {CATEGORY_TAGS[c.slug] ?? "Explore"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 lg:hidden" aria-hidden="true">
          {categories.map((c, i) => (
            <span
              key={c.id}
              className={
                i === activeCategoryDot
                  ? "h-1 w-6 rounded-full bg-foreground"
                  : "h-1.5 w-1.5 rounded-full bg-border"
              }
            />
          ))}
        </div>
      </section>


      {/* Pre-order — first product row so upcoming drops lead the page */}
      {preorders.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-4">
          <Reveal>
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
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {preorders.map((p, i) => (
              <Reveal key={p.id} delay={i * 70} className="flex h-full [&>article]:w-full">
                <ProductCard product={p} onQuickView={setSelected} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-6 sm:pt-9">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow text-moss">Handpicked</span>
                <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Featured picks</h2>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/shop">View all</Link>
              </Button>
            </div>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70} className="flex h-full [&>article]:w-full">
                <ProductCard product={p} onQuickView={setSelected} />
              </Reveal>
            ))}
          </div>
          {!showAllFeatured && allFeatured.length > featured.length && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" className="press" onClick={() => setShowAllFeatured(true)}>
                Show more featured picks
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-11">
        <Reveal>
          <span className="eyebrow text-moss">Fresh in</span>
          <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">New arrivals</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {latest.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70} className="flex h-full [&>article]:w-full">
              <ProductCard product={p} onQuickView={setSelected} />
            </Reveal>
          ))}
        </div>
        {!showAllLatest && allLatest.length > latest.length && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="press" onClick={() => setShowAllLatest(true)}>
              Show more new arrivals
            </Button>
          </div>
        )}
        <Reveal className="mt-8 flex justify-center">
          <Button size="lg" asChild className="press">
            <Link to="/shop">
              Browse all products <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </section>
      {/* Sold out */}
      {soldOut.length > 0 && (
        <section className="mx-auto max-w-6xl border-t border-border px-5 py-14">
          <Reveal>
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
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {soldOut.map((p, i) => (
              <Reveal key={p.id} delay={i * 70} className="flex h-full [&>article]:w-full">
                <ProductCard product={p} onQuickView={setSelected} />
              </Reveal>
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

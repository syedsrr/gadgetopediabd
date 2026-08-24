import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Truck, ShieldCheck, ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery, withCategories } from "@/lib/catalog";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "gadgetOpedia n' Lifestyle — Gadgets & Lifestyle Store in BD" },
      {
        name: "description",
        content:
          "Shop smart watches, earbuds, power banks and lifestyle gear at gadgetOpedia n' Lifestyle. Genuine products, cash on delivery across Bangladesh.",
      },
      { property: "og:title", content: "gadgetOpedia n' Lifestyle" },
      {
        property: "og:description",
        content: "Curated gadgets and lifestyle upgrades, delivered across Bangladesh.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const productsWithCategory = useMemo(() => withCategories(products, categories), [products, categories]);

  const featured = productsWithCategory.filter((p) => p.is_featured).slice(0, 8);
  const latest = productsWithCategory.slice(-8).reverse();

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-canopy text-canopy-foreground">
        <img
          src="/images/hero.jpg"
          alt="Gadgets and lifestyle accessories arranged on a green backdrop"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="eyebrow text-accent">Gadgets · Audio · Lifestyle</span>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
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
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Fast delivery", text: "Inside Dhaka in 24–48 hours" },
            { icon: BadgeCheck, title: "100% genuine", text: "Sourced from official channels" },
            { icon: ShieldCheck, title: "Warranty backed", text: "Easy replacement support" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow text-moss">Browse</span>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Shop by category</h2>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="card-hover rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <p className="font-display text-base font-semibold text-foreground">{c.name}</p>
              {c.tagline && <p className="mt-1 text-xs text-muted-foreground">{c.tagline}</p>}
              <span className="mt-3 inline-flex items-center text-xs font-medium text-moss">
                Explore <ArrowRight className="ml-1 h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-moss">Handpicked</span>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Featured picks</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/shop">View all</Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <span className="eyebrow text-moss">Fresh in</span>
        <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">New arrivals</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

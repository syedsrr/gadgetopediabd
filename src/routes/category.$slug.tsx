import { createFileRoute, Link } from "@tanstack/react-router";

import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { staticCategories, staticProducts } from "@/lib/staticCatalog";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const pretty = params.slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${pretty} — gadgetOpedia n' Lifestyle` },
        {
          name: "description",
          content: `Shop ${pretty.toLowerCase()} at gadgetOpedia n' Lifestyle. Genuine products with warranty and cash on delivery in Bangladesh.`,
        },
        { property: "og:title", content: `${pretty} — gadgetOpedia n' Lifestyle` },
        {
          property: "og:description",
          content: `Shop ${pretty.toLowerCase()} at gadgetOpedia n' Lifestyle.`,
        },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const categories = staticCategories;
  const isPending = false;

  const category = categories.find((c) => c.slug === slug);
  const list = staticProducts.filter((p) => p.categories?.slug === slug);

  return (
    <SiteLayout>
      <div className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <nav className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-moss">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <span className="text-foreground">{category?.name ?? slug}</span>
          </nav>
          <h1 className="mt-3 font-display text-3xl font-bold">{category?.name ?? slug}</h1>
          {category?.tagline && (
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{category.tagline}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No products in this category yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

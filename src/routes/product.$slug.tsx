import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { categoriesQuery, productQuery, productsQuery, withCategories } from "@/lib/catalog";
import { discountPercent, formatBDT } from "@/lib/format";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    return { product };
  },
  head: ({ params, loaderData }) => {
    const product = loaderData?.product ?? null;
    const pretty =
      product?.name ??
      params.slug
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

    if (!product) {
      return {
        meta: [
          { title: "Product unavailable — gadgetOpedia n' Lifestyle" },
          { name: "robots", content: "noindex" },
        ],
      };
    }

    const title = `${pretty} — Price in Bangladesh | gadgetOpedia n' Lifestyle`.slice(0, 68);
    const description = (
      product.short_description ??
      product.description ??
      `Buy ${pretty} at gadgetOpedia n' Lifestyle with genuine warranty and cash on delivery across Bangladesh.`
    ).slice(0, 155);
    const image =
      product.image_url && product.image_url.startsWith("https://") ? product.image_url : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: pretty,
            description,
            ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
            ...(image ? { image: [image] } : {}),
            offers: {
              "@type": "Offer",
              priceCurrency: "BDT",
              price: Number(product.price),
              availability:
                product.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isPending } = useQuery(productQuery(slug));
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const productsWithCategory = useMemo(
    () => withCategories(products, categories),
    [products, categories],
  );

  if (isPending) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This item may have been removed from the catalogue.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/shop">Back to shop</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const off = discountPercent(product.price, product.old_price);
  const soldOut = product.stock <= 0;
  const related = productsWithCategory
    .filter((p) => p.id !== product.id && p.categories?.slug === product.categories?.slug)
    .slice(0, 4);

  const line = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    image_url: product.image_url,
    max_stock: Number(product.stock ?? 0),
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-moss">
            Home
          </Link>
          <span className="px-1.5">/</span>
          {product.categories ? (
            <>
              <Link
                to="/category/$slug"
                params={{ slug: product.categories.slug }}
                className="hover:text-moss"
              >
                {product.categories.name}
              </Link>
              <span className="px-1.5">/</span>
            </>
          ) : null}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border bg-secondary shadow-soft">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div>
            {product.brand && <span className="eyebrow text-moss">{product.brand}</span>}
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight">{product.name}</h1>
            {product.short_description && (
              <p className="mt-3 text-sm text-muted-foreground">{product.short_description}</p>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">
                {formatBDT(product.price)}
              </span>
              {product.old_price && Number(product.old_price) > Number(product.price) && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatBDT(product.old_price)}
                </span>
              )}
              {off !== null && (
                <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-sale-foreground">
                  Save {off}%
                </span>
              )}
            </div>

            <p className="mt-3 text-sm">
              {soldOut ? (
                <span className="font-semibold text-sale">Out of stock</span>
              ) : (
                <span className="font-medium text-moss">In stock · {product.stock} available</span>
              )}
            </p>

            <Separator className="my-6" />

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-9 text-center text-sm font-semibold">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                size="lg"
                disabled={soldOut}
                onClick={() => {
                  add(line, qty);
                  toast.success("Added to cart");
                }}
              >
                <ShoppingBag className="mr-1.5 h-4 w-4" /> Add to cart
              </Button>

              <Button
                size="lg"
                variant="secondary"
                disabled={soldOut}
                onClick={() => {
                  add(line, qty);
                  navigate({ to: "/checkout" });
                }}
              >
                Order now
              </Button>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-moss" /> Delivery ৳70 · 24–48h inside Dhaka
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-moss" /> 100% genuine product guarantee
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-moss" /> Cash on delivery available
              </li>
            </ul>
          </div>
        </div>

        {product.description && (
          <section className="mt-14 max-w-3xl">
            <h2 className="font-display text-xl font-bold">Product details</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold">You may also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}

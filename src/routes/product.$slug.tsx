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
import { formatBDT, formatReleaseDate, isPreorder, isPurchasable, priceInfo } from "@/lib/format";

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

    const title = (
      product.seo_title ?? `${pretty} — Price in Bangladesh | gadgetOpedia n' Lifestyle`
    ).slice(0, 68);
    const description = (
      product.seo_description ??
      product.short_description ??
      product.description ??
      `Buy ${pretty} at gadgetOpedia n' Lifestyle with genuine warranty and cash on delivery across Bangladesh.`
    ).slice(0, 155);
    const image =
      product.image_url && product.image_url.startsWith("https://") ? product.image_url : null;

    const url = `https://www.gadgetopedia.shop/product/${encodeURIComponent(params.slug)}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: pretty,
            description,
            url,
            ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
            ...(image ? { image: [image] } : {}),
            offers: {
              "@type": "Offer",
              priceCurrency: "BDT",
              price: priceInfo(product).selling,
              url,
              ...(product.sku ? { sku: product.sku } : {}),
              ...(isPreorder(product) && product.preorder_release_date
                ? { availabilityStarts: product.preorder_release_date }
                : {}),
              availability: isPreorder(product)
                ? "https://schema.org/PreOrder"
                : product.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://www.gadgetopedia.shop/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Shop",
                item: "https://www.gadgetopedia.shop/shop",
              },
              { "@type": "ListItem", position: 3, name: pretty, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { product: loadedProduct } = Route.useLoaderData();
  const { data: fetched, isPending } = useQuery(productQuery(slug));
  const product = fetched ?? loadedProduct;
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const productsWithCategory = useMemo(
    () => withCategories(products, categories),
    [products, categories],
  );

  if (isPending && !product) {
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

  const { selling, compareAt, off } = priceInfo(product);
  const preorder = isPreorder(product);
  const soldOut = !isPurchasable(product) && !preorder;
  const arrival = formatReleaseDate(product.preorder_release_date);
  const gallery = product.product_images?.length
    ? product.product_images
    : product.image_url
      ? [{ id: "primary", url: product.image_url, alt: product.image_alt ?? product.name }]
      : [];
  const activeImage = gallery[Math.min(imageIndex, gallery.length - 1)] ?? null;
  const specs = product.product_specifications ?? [];
  const related = productsWithCategory
    .filter((p) => p.id !== product.id && p.categories?.slug === product.categories?.slug)
    .slice(0, 4);

  const line = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: selling,
    image_url: product.image_url,
    max_stock: preorder ? 99 : Number(product.stock ?? 0),
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
          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-secondary shadow-soft">
              {activeImage ? (
                <img
                  src={activeImage.url}
                  alt={activeImage.alt ?? product.name}
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
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {gallery.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    aria-label={`Show image ${i + 1}`}
                    onClick={() => setImageIndex(i)}
                    className={
                      i === imageIndex
                        ? "h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-primary"
                        : "h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border opacity-80"
                    }
                  >
                    <img
                      src={img.url}
                      alt={img.alt ?? product.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
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
                {formatBDT(selling)}
              </span>
              {compareAt !== null && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatBDT(compareAt)}
                </span>
              )}
              {off !== null && (
                <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-sale-foreground">
                  Save {off}%
                </span>
              )}
            </div>

            <p className="mt-3 text-sm">
              {preorder ? (
                <span className="font-semibold text-moss">
                  Pre-order · {arrival ? `expected ${arrival}` : "ships when stock arrives"}
                </span>
              ) : soldOut ? (
                <span className="font-semibold text-sale">Out of stock</span>
              ) : (
                <span className="font-medium text-moss">In stock · {product.stock} available</span>
              )}
            </p>
            {preorder && product.preorder_note && (
              <p className="mt-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                {product.preorder_note}
              </p>
            )}

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
                  onClick={() =>
                    setQty((q) => Math.min(preorder ? 99 : product.stock || 99, q + 1))
                  }
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
                <ShoppingBag className="mr-1.5 h-4 w-4" />{" "}
                {preorder ? "Pre-order now" : "Add to cart"}
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
                {preorder ? "Reserve & checkout" : "Order now"}
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

        {specs.length > 0 && (
          <section className="mt-14 max-w-3xl">
            <h2 className="font-display text-xl font-bold">Specifications</h2>
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border">
              {specs.map((sp) => (
                <div key={sp.id} className="flex justify-between gap-6 px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">{sp.name}</dt>
                  <dd className="text-right font-medium">{sp.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

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

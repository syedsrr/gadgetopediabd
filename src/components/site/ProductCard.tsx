import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import type { ProductWithCategory } from "@/lib/catalog";
import { discountPercent, formatBDT } from "@/lib/format";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: ProductWithCategory;
  onQuickView?: (product: ProductWithCategory) => void;
}) {
  const { add } = useCart();
  const off = discountPercent(product.price, product.old_price);
  const soldOut = product.stock <= 0;

  return (
    <article className="card-hover group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-secondary"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
        {off !== null && (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-[0.7rem] font-bold text-sale-foreground">
            -{off}%
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-full bg-canopy px-2.5 py-1 text-[0.7rem] font-semibold text-canopy-foreground">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categories?.name && (
          <span className="eyebrow text-muted-foreground">{product.categories.name}</span>
        )}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="font-display text-[0.95rem] font-semibold leading-snug text-foreground transition-colors hover:text-moss"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-display text-lg font-bold text-primary">{formatBDT(product.price)}</span>
          {product.old_price && Number(product.old_price) > Number(product.price) && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(product.old_price)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={soldOut}
          onClick={() =>
            add({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: Number(product.price),
              image_url: product.image_url,
            })
          }
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          Add to cart
        </Button>
      </div>
    </article>
  );
}

import { Link } from "@tanstack/react-router";
import { Heart, ImageOff, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import type { ProductWithCategory } from "@/lib/catalog";
import { formatBDT, formatReleaseDate, isPreorder, isPurchasable, priceInfo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: ProductWithCategory;
  onQuickView?: (product: ProductWithCategory) => void;
}) {
  const { add } = useCart();
  const { ids, toggle, isSignedIn } = useWishlist();
  const saved = ids.has(product.id);
  const { selling, compareAt, off } = priceInfo(product);
  const preorder = isPreorder(product);
  const soldOut = !isPurchasable(product) && !preorder;
  const lowThreshold = Number(product.low_stock_threshold ?? 5);
  const arrival = formatReleaseDate(product.preorder_release_date);

  return (
    <article className="card-hover group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft sm:rounded-2xl">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-secondary"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.image_alt ?? product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            width={1024}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            No image
          </div>
        )}

        {off !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-1 text-[0.65rem] font-bold text-sale-foreground sm:left-3 sm:top-3 sm:px-2.5 sm:text-[0.7rem]">
            -{off}%
          </span>
        )}
        {preorder && (
          <span className="absolute bottom-2 left-2 rounded-full bg-canopy px-2 py-1 text-[0.65rem] font-bold uppercase text-canopy-foreground sm:bottom-3 sm:left-3 sm:px-2.5 sm:text-[0.7rem]">
            Pre-order
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-canopy/60">
            <span className="rounded-full bg-canopy px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-canopy-foreground">
              Out of stock
            </span>
          </span>
        )}
      </Link>

      <Button
        variant="ghost"
        size="icon"
        type="button"
        aria-label={saved ? "Remove from wish list" : "Save to wish list"}
        aria-pressed={saved}
        className="absolute right-2 top-2 h-10 w-10 rounded-full bg-background/90 text-muted-foreground shadow-soft hover:text-sale sm:right-3 sm:top-3"
        onClick={() => {
          if (!isSignedIn) {
            toast.info("Sign in to save products to your wish list");
            return;
          }
          toggle.mutate(product.id);
        }}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-sale text-sale")} />
      </Button>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        {product.categories?.name && (
          <span className="eyebrow text-muted-foreground">{product.categories.name}</span>
        )}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 min-h-10 font-display text-sm font-semibold leading-snug text-foreground transition-colors hover:text-moss sm:text-[0.95rem]"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-display text-base font-bold text-primary sm:text-lg">
            {formatBDT(selling)}
          </span>
          {compareAt !== null && (
            <span className="hidden text-xs text-muted-foreground line-through min-[390px]:inline sm:text-sm">
              {formatBDT(compareAt)}
            </span>
          )}
        </div>
        {preorder ? (
          <p className="text-xs font-semibold text-moss">
            {arrival ? `Ships from ${arrival}` : "Ships when stock arrives"}
          </p>
        ) : (
          product.stock > 0 &&
          product.stock <= lowThreshold && (
            <p className="text-xs font-semibold text-sale">Only {product.stock} left in stock</p>
          )
        )}
        <Button
          size="sm"
          className="mt-2 h-10 w-full px-2 text-xs sm:h-8 sm:px-3"
          disabled={soldOut}
          onClick={() =>
            add({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: selling,
              image_url: product.image_url,
              max_stock: preorder ? 99 : Number(product.stock ?? 0),
            })
          }
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          {soldOut ? "Out of stock" : preorder ? "Pre-order now" : "Add to cart"}
        </Button>
        {onQuickView && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-0.5 h-9 w-full px-1 text-[0.7rem] text-muted-foreground hover:text-moss sm:h-8 sm:text-xs"
            onClick={() => onQuickView(product)}
          >
            View full specs
          </Button>
        )}
      </div>
    </article>
  );
}

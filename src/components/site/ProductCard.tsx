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
  const soldOut = !isPurchasable(product);
  const lowThreshold = Number(product.low_stock_threshold ?? 5);

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
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-[0.7rem] font-bold text-sale-foreground">
            -{off}%
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

      <button
        type="button"
        aria-label={saved ? "Remove from wish list" : "Save to wish list"}
        aria-pressed={saved}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-soft transition hover:text-sale"
        onClick={() => {
          if (!isSignedIn) {
            toast.info("Sign in to save products to your wish list");
            return;
          }
          toggle.mutate(product.id);
        }}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-sale text-sale")} />
      </button>

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
          <span className="font-display text-lg font-bold text-primary">
            {formatBDT(selling)}
          </span>
          {compareAt !== null && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(compareAt)}
            </span>
          )}
        </div>
        {!soldOut && product.stock > 0 && product.stock <= lowThreshold && (
          <p className="text-xs font-semibold text-sale">Only {product.stock} left in stock</p>
        )}
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={soldOut}
          onClick={() =>
            add({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: selling,
              image_url: product.image_url,
              max_stock: Number(product.stock ?? 0),
            })
          }
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          {soldOut ? "Out of stock" : "Add to cart"}
        </Button>
        {onQuickView && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 w-full text-xs text-muted-foreground hover:text-moss"
            onClick={() => onQuickView(product)}
          >
            View full specs
          </Button>
        )}
      </div>
    </article>
  );
}

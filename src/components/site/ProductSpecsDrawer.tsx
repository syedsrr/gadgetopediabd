import { useQuery } from "@tanstack/react-query";
import { ImageOff, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import type { ProductWithCategory } from "@/lib/catalog";
import { formatBDT, isPreorder, isPurchasable, priceInfo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  product: ProductWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductSpecsDrawer({ product, open, onOpenChange }: Props) {
  const { add } = useCart();
  const info = product ? priceInfo(product) : null;
  const off = info?.off ?? null;
  const selling = info?.selling ?? 0;
  const preorder = product ? isPreorder(product) : false;
  const soldOut = product ? !isPurchasable(product) && !preorder : true;
  const maxQty = preorder ? 99 : Math.max(1, product?.stock ?? 1);

  const { data: specs = [] } = useQuery({
    queryKey: ["product-specs", product?.id],
    enabled: Boolean(product?.id) && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_specifications")
        .select("id, name, value, sort_order")
        .eq("product_id", product!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const variations = product
    ? [product.brand ? `${product.brand} — Standard` : "Standard"]
    : [];
  const [variation, setVariation] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
    setVariation(0);
  }, [product?.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {product && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-xl">{product.name}</SheetTitle>
              <SheetDescription>
                {product.short_description ?? product.categories?.name ?? "Product details"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.image_alt ?? product.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImageOff className="h-6 w-6" aria-hidden="true" />
                  No image
                </div>
              )}
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-primary">
                {formatBDT(selling)}
              </span>
              {off !== null && info?.compareAt != null && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatBDT(info.compareAt)}
                  </span>
                  <span className="rounded-full bg-sale px-2 py-0.5 text-[0.7rem] font-bold text-sale-foreground">
                    -{off}%
                  </span>
                </>
              )}
            </div>

            <Separator className="my-5" />

            <dl className="space-y-3 text-sm">
              {[
                { label: "Category", value: product.categories?.name },
                { label: "Brand", value: product.brand },
                { label: "SKU", value: product.sku },
                ...specs.map((sp) => ({ label: sp.name, value: sp.value })),
                { label: "Availability", value: soldOut ? "Sold out" : `${product.stock} in stock` },
              ]
                .filter((r) => r.value)
                .map((r) => (
                  <div key={r.label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{r.label}</dt>
                    <dd className="text-right font-medium text-foreground">{r.value}</dd>
                  </div>
                ))}
            </dl>

            <Separator className="my-5" />

            <div>
              <p className="eyebrow text-muted-foreground">Variation</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {variations.map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariation(i)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      variation === i
                        ? "border-transparent bg-canopy text-canopy-foreground"
                        : "border-border bg-card text-foreground/70 hover:border-moss hover:text-moss",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="eyebrow text-muted-foreground">Quantity</p>
              <div className="mt-2 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-8 text-center font-display text-base font-semibold">{qty}</span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Increase quantity"
                  disabled={qty >= maxQty || soldOut}
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {product.description && (
              <>
                <Separator className="my-5" />
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {product.description}
                </p>
              </>
            )}

            <Button
              className="mt-6 w-full"
              disabled={soldOut}
              onClick={() => {
                add(
                  {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: selling,
                    image_url: product.image_url,
                    max_stock: Number(product.stock ?? 0),
                  },
                  qty,
                );
                onOpenChange(false);
              }}
            >
              <ShoppingBag className="mr-1.5 h-4 w-4" />
              {soldOut ? "Sold out" : `Add ${qty} to cart · ${formatBDT(selling * qty)}`}
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

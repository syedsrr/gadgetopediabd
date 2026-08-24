import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import type { ProductWithCategory } from "@/lib/catalog";
import { discountPercent, formatBDT } from "@/lib/format";

type Props = {
  product: ProductWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductSpecsDrawer({ product, open, onOpenChange }: Props) {
  const { add } = useCart();
  const off = product ? discountPercent(product.price, product.old_price) : null;
  const soldOut = (product?.stock ?? 0) <= 0;

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

            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-secondary">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-primary">
                {formatBDT(product.price)}
              </span>
              {off !== null && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatBDT(product.old_price)}
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
                add({
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.price),
                  image_url: product.image_url,
                });
                onOpenChange(false);
              }}
            >
              <ShoppingBag className="mr-1.5 h-4 w-4" />
              {soldOut ? "Sold out" : "Add to cart"}
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content: "Review the gadgets in your cart and continue to cash-on-delivery checkout.",
      },
      { property: "og:title", content: "Your cart — gadgetOpedia n' Lifestyle" },
      { property: "og:description", content: "Review your cart and checkout securely." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, updateQuantity: setQuantity, removeFromCart: remove, count } = useCart();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <span className="eyebrow text-moss">Checkout step 1</span>
        <h1 className="mt-1 font-display text-3xl font-bold">Your cart</h1>

        {lines.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">Your cart is empty right now.</p>
            <Button className="mt-5" asChild>
              <Link to="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <ul className="space-y-4">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
                >
                  <Link
                    to="/product/$slug"
                    params={{ slug: l.slug }}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
                  >
                    {l.image_url && (
                      <img src={l.image_url} alt={l.name} className="h-full w-full object-cover" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: l.slug }}
                      className="line-clamp-2 text-sm font-semibold hover:text-moss"
                    >
                      {l.name}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-primary">{formatBDT(l.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Decrease ${l.name}`}
                          onClick={() => setQuantity(l.id, l.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Increase ${l.name}`}
                          onClick={() => setQuantity(l.id, l.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-sale"
                        aria-label={`Remove ${l.name}`}
                        onClick={() => remove(l.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-bold">{formatBDT(l.price * l.quantity)}</p>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-lg font-bold">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Items</dt>
                  <dd>{count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatBDT(subtotal)}</dd>
                </div>
              </dl>
              <Separator className="my-4" />
              <div className="flex justify-between font-display text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatBDT(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Shipping is added at checkout: ৳60 inside Dhaka, ৳120 outside Dhaka.
              </p>
              <Button className="mt-5 w-full" size="lg" asChild>
                <Link to="/checkout">Proceed to checkout</Link>
              </Button>
              <Button variant="ghost" className="mt-2 w-full" asChild>
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

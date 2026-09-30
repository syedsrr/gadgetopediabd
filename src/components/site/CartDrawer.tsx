import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";


export function CartDrawer({ compact = false }: { compact?: boolean }) {
  const { lines, count, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open cart drawer"
          className={cn(
            "relative text-canopy-foreground/85 transition-all duration-300 hover:bg-white/10 hover:text-accent lg:h-11 lg:w-11",
            compact ? "h-9 w-9" : "h-11 w-11",
          )}
        >
          <ShoppingBag className={cn("transition-all duration-300", compact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5")} />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-sale px-1 text-[0.65rem] font-bold text-sale-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="glass-forest flex w-full flex-col rounded-l-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-canopy-foreground sm:max-w-md sm:p-6">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-xl">Your cart</SheetTitle>
          <SheetDescription className="text-canopy-foreground/60">
            {count === 0 ? "No items yet." : `${count} item${count === 1 ? "" : "s"} ready to order.`}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-10 w-10 text-canopy-foreground/50" aria-hidden="true" />
            <p className="text-sm text-canopy-foreground/65">Your cart is empty.</p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {lines.map((l) => (
                <li key={l.id} className="grid grid-cols-[4rem_minmax(0,1fr)] glass-chip gap-3 rounded-xl p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/25">
                    {l.image_url && (
                      <img src={l.image_url} alt={l.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">{l.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-accent">{formatBDT(l.price)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-full border border-white/20">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          aria-label={`Decrease ${l.name}`}
                          onClick={() => updateQuantity(l.id, l.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          aria-label={`Increase ${l.name}`}
                          disabled={l.quantity >= l.max_stock}
                          onClick={() => updateQuantity(l.id, l.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-canopy-foreground/60 hover:text-sale"
                        aria-label={`Remove ${l.name}`}
                        onClick={() => removeFromCart(l.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="col-start-2 text-right text-sm font-bold">{formatBDT(l.price * l.quantity)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-2 border-t border-white/12 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-canopy-foreground/65">Subtotal</span>
                <span className="font-bold">{formatBDT(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-canopy-foreground/55">
                Shipping is added at checkout (৳60 inside Dhaka · ৳120 outside).
              </p>
              <Separator className="my-4 bg-white/12" />
              <Button className="w-full" size="lg" asChild onClick={() => setOpen(false)}>
                <Link to="/checkout">Checkout · {formatBDT(subtotal)}</Link>
              </Button>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="flex-1 border-white/25 bg-transparent text-canopy-foreground hover:bg-white/10 hover:text-accent" asChild onClick={() => setOpen(false)}>
                  <Link to="/cart">View cart</Link>
                </Button>
                <Button variant="ghost" className="flex-1 text-canopy-foreground/70 hover:bg-white/10 hover:text-accent" onClick={clearCart}>
                  Clear cart
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

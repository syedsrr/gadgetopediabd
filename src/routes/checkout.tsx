import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";
import { placeOrder, SHIPPING_FEES, type ShippingLocation } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "One-page cash-on-delivery checkout: enter your name, phone, address and delivery zone to confirm your order.",
      },
      { property: "og:title", content: "Checkout — gadgetOpedia n' Lifestyle" },
      { property: "og:description", content: "One-page cash-on-delivery checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { lines, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [location, setLocation] = useState<ShippingLocation>("inside_dhaka");
  const [submitting, setSubmitting] = useState(false);
  const submitOrder = useServerFn(placeOrder);

  const shipping = SHIPPING_FEES[location];
  const total = subtotal + shipping;

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    if (!/^[0-9+\-\s]{11,15}$/.test(form.phone.trim())) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrder({
        data: {
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          location,
          address: form.address.trim(),
          ...(form.note.trim() ? { note: form.note.trim() } : {}),
          items: lines.map((l) => ({ product_id: l.id, quantity: l.quantity })),
        },
      });
      clearCart();
      navigate({ to: "/order-success/$id", params: { id: result.id } });
    } catch (err) {
      console.error(err);
      toast.error("Could not place the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <span className="eyebrow text-moss">Secure checkout</span>
        <h1 className="mt-1 font-display text-3xl font-bold">Complete your order</h1>

        {lines.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button className="mt-5" asChild>
              <Link to="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Customer name</Label>
                  <Input
                    id="name"
                    required
                    maxLength={80}
                    value={form.customer_name}
                    onChange={(e) => set("customer_name", e.target.value)}
                    placeholder="e.g. Rakib Hasan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    required
                    inputMode="tel"
                    maxLength={15}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Delivery address</Label>
                <Textarea
                  id="address"
                  required
                  maxLength={400}
                  rows={3}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="House, road, area, landmark…"
                />
              </div>

              <div className="space-y-2">
                <Label>Delivery location</Label>
                <RadioGroup
                  value={location}
                  onValueChange={(v) => setLocation(v as ShippingLocation)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {(
                    [
                      { value: "inside_dhaka", label: "Inside Dhaka", eta: "24–48 hours" },
                      { value: "outside_dhaka", label: "Outside Dhaka", eta: "2–4 days" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      htmlFor={opt.value}
                      className={
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors " +
                        (location === opt.value
                          ? "border-moss bg-secondary"
                          : "border-border bg-card hover:border-moss")
                      }
                    >
                      <RadioGroupItem id={opt.value} value={opt.value} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-semibold">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatBDT(SHIPPING_FEES[opt.value])} · {opt.eta}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">Order note (optional)</Label>
                <Textarea
                  id="note"
                  maxLength={300}
                  rows={2}
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  placeholder="Preferred delivery time, colour, etc."
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Payment method:{" "}
                <span className="font-semibold text-foreground">Cash on delivery</span> — pay the
                courier when your parcel arrives.
              </p>
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-lg font-bold">Order summary</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span className="min-w-0 flex-1 text-muted-foreground">
                      {l.name} <span className="text-foreground">× {l.quantity}</span>
                    </span>
                    <span className="font-medium">{formatBDT(l.price * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatBDT(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping fee</dt>
                  <dd>{formatBDT(shipping)}</dd>
                </div>
              </dl>
              <Separator className="my-4" />
              <div className="flex justify-between font-display text-lg font-bold">
                <span>Grand total</span>
                <span className="text-primary">{formatBDT(total)}</span>
              </div>
              <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
                {submitting ? "Placing order…" : "Confirm order"}
              </Button>
              <Button variant="ghost" className="mt-2 w-full" asChild>
                <Link to="/cart">Back to cart</Link>
              </Button>
            </aside>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}

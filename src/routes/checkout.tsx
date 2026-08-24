import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { DELIVERY_FEE } from "@/lib/catalog";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "Place your order with cash on delivery. Enter your name, phone and address to confirm.",
      },
      { property: "og:title", content: "Checkout — gadgetOpedia n' Lifestyle" },
      { property: "og:description", content: "Place your order with cash on delivery." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    area: "",
    address: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{ code: string; total: number } | null>(null);

  const total = subtotal + DELIVERY_FEE;

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
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          area: form.area.trim() || null,
          address: form.address.trim(),
          note: form.note.trim() || null,
          subtotal,
          delivery_fee: DELIVERY_FEE,
          total,
        })
        .select("id, order_code, total")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.id,
          product_name: l.name,
          quantity: l.quantity,
          unit_price: l.price,
        })),
      );
      if (itemsError) throw itemsError;

      setPlaced({ code: order.order_code, total: Number(order.total) });
      clear();
    } catch (err) {
      console.error(err);
      toast.error("Could not place the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-5 py-20 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-moss" />
          <h1 className="mt-5 font-display text-3xl font-bold">Order confirmed</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Thank you! We'll call you shortly to confirm delivery details.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <p className="eyebrow text-muted-foreground">Order code</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{placed.code}</p>
            <Separator className="my-4" />
            <p className="text-sm">
              Amount payable on delivery:{" "}
              <span className="font-bold">{formatBDT(placed.total)}</span>
            </p>
          </div>
          <Button className="mt-8" asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <span className="eyebrow text-moss">Checkout step 2</span>
        <h1 className="mt-1 font-display text-3xl font-bold">Delivery details</h1>

        {lines.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button className="mt-5" asChild>
              <Link to="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
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
                  <Label htmlFor="phone">Mobile number</Label>
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
                <Label htmlFor="area">Area / city</Label>
                <Input
                  id="area"
                  maxLength={80}
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Full delivery address</Label>
                <Textarea
                  id="address"
                  required
                  maxLength={400}
                  rows={3}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="House, road, landmark…"
                />
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
                Payment method: <span className="font-semibold text-foreground">Cash on delivery</span>{" "}
                — pay the courier when your parcel arrives.
              </p>
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-lg font-bold">Your order</h2>
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
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd>{formatBDT(DELIVERY_FEE)}</dd>
                </div>
              </dl>
              <Separator className="my-4" />
              <div className="flex justify-between font-display text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatBDT(total)}</span>
              </div>
              <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
                {submitting ? "Placing order…" : "Confirm order"}
              </Button>
            </aside>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}

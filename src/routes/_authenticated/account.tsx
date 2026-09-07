import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteMyAddress,
  getMyAddresses,
  getMyOrders,
  saveMyAddress,
  setDefaultAddress,
} from "@/lib/account.functions";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content: "View your gadgetOpedia n' Lifestyle order history and manage saved delivery addresses.",
      },
      { property: "og:title", content: "My account — gadgetOpedia n' Lifestyle" },
      { property: "og:description", content: "Your order history and saved delivery addresses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const emptyForm = {
  id: undefined as string | undefined,
  label: "",
  recipient_name: "",
  phone: "",
  address: "",
  area: "",
  is_default: false,
};

const statusTone: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-moss/15 text-moss",
  shipped: "bg-accent/20 text-foreground",
  delivered: "bg-primary/15 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loadOrders = useServerFn(getMyOrders);
  const loadAddresses = useServerFn(getMyAddresses);
  const saveAddress = useServerFn(saveMyAddress);
  const removeAddress = useServerFn(deleteMyAddress);
  const makeDefault = useServerFn(setDefaultAddress);

  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => loadOrders({}) });
  const addresses = useQuery({ queryKey: ["my-addresses"], queryFn: () => loadAddresses({}) });

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["my-addresses"] });

  const save = useMutation({
    mutationFn: () =>
      saveAddress({
        data: {
          ...(form.id ? { id: form.id } : {}),
          label: form.label.trim() || undefined,
          recipient_name: form.recipient_name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          area: form.area.trim() || undefined,
          is_default: form.is_default,
        },
      }),
    onSuccess: async () => {
      toast.success("Address saved");
      setForm(emptyForm);
      setShowForm(false);
      await invalidate();
    },
    onError: () => toast.error("Please check the details and try again"),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeAddress({ data: { id } }),
    onSuccess: async () => {
      toast.success("Address removed");
      await invalidate();
    },
    onError: () => toast.error("Could not remove the address"),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => makeDefault({ data: { id } }),
    onSuccess: invalidate,
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow text-moss">My account</span>
            <h1 className="mt-1 font-display text-3xl font-bold">Orders &amp; addresses</h1>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Order history</h2>
          {orders.isLoading ? (
            <div className="mt-4 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : orders.isError ? (
            <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm">
              <p className="text-muted-foreground">We could not load your orders.</p>
              <Button className="mt-4" variant="outline" onClick={() => orders.refetch()}>
                Try again
              </Button>
            </div>
          ) : (orders.data ?? []).length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
              <p className="text-sm text-muted-foreground">You have no orders yet.</p>
              <Button className="mt-5" asChild>
                <Link to="/shop">Start shopping</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {(orders.data ?? []).map((order) => (
                <li key={order.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-bold">{order.order_code}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toISOString().slice(0, 10)} · {order.area ?? "—"}
                      </p>
                    </div>
                    <Badge className={statusTone[order.status] ?? "bg-secondary text-secondary-foreground"}>
                      {order.status}
                    </Badge>
                  </div>
                  <Separator className="my-4" />
                  <ul className="space-y-2 text-sm">
                    {(order.order_items ?? []).map((item, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span className="min-w-0 flex-1 text-muted-foreground">
                          {item.product_name} <span className="text-foreground">× {item.quantity}</span>
                        </span>
                        <span className="font-medium">
                          {formatBDT(Number(item.unit_price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Delivery {formatBDT(Number(order.delivery_fee))}
                    </span>
                    <span className="font-display text-base font-bold text-primary">
                      {formatBDT(Number(order.total))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Saved addresses</h2>
            <Button
              variant={showForm ? "ghost" : "default"}
              onClick={() => {
                setForm(emptyForm);
                setShowForm((v) => !v);
              }}
            >
              {showForm ? "Cancel" : "Add address"}
            </Button>
          </div>

          {showForm && (
            <form
              className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="label">Label (optional)</Label>
                  <Input
                    id="label"
                    maxLength={40}
                    value={form.label}
                    onChange={(e) => set("label", e.target.value)}
                    placeholder="Home, Office…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipient">Recipient name</Label>
                  <Input
                    id="recipient"
                    required
                    maxLength={80}
                    value={form.recipient_name}
                    onChange={(e) => set("recipient_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aphone">Phone number</Label>
                  <Input
                    id="aphone"
                    required
                    inputMode="tel"
                    maxLength={15}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="area">Area (optional)</Label>
                  <Input
                    id="area"
                    maxLength={60}
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                    placeholder="Inside Dhaka"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aaddress">Full address</Label>
                <Textarea
                  id="aaddress"
                  required
                  rows={3}
                  maxLength={400}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="House, road, area, landmark…"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_default}
                  onCheckedChange={(v) => set("is_default", Boolean(v))}
                />
                Use this as my default address
              </label>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save address"}
              </Button>
            </form>
          )}

          {addresses.isLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded-2xl bg-muted" />
          ) : (addresses.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No saved addresses yet — add one for faster checkout.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {(addresses.data ?? []).map((a) => (
                <li key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{a.label || a.recipient_name}</p>
                    {a.is_default && <Badge className="bg-moss/15 text-moss">Default</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{a.recipient_name}</p>
                  <p className="text-sm text-muted-foreground">{a.phone}</p>
                  <p className="mt-2 text-sm">{a.address}</p>
                  {a.area && <p className="text-xs text-muted-foreground">{a.area}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({
                          id: a.id,
                          label: a.label ?? "",
                          recipient_name: a.recipient_name,
                          phone: a.phone,
                          address: a.address,
                          area: a.area ?? "",
                          is_default: a.is_default,
                        });
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    {!a.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefault.mutate(a.id)}
                        disabled={setDefault.isPending}
                      >
                        Make default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => del.mutate(a.id)}
                      disabled={del.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Heart, ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteMyAddress,
  getMyAddresses,
  getMyOrders,
  saveMyAddress,
  setDefaultAddress,
} from "@/lib/account.functions";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";
import { useSession } from "@/lib/useAdmin";
import { useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "Manage your gadgetOpedia n' Lifestyle profile, wish list, saved addresses and track your orders.",
      },
      { property: "og:title", content: "My account — gadgetOpedia n' Lifestyle" },
      {
        property: "og:description",
        content: "Your profile, wish list, saved addresses and order tracking.",
      },
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

const TRACK_STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;
const STEP_LABEL: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
};

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="mt-3 text-xs font-semibold text-destructive">
        This order was cancelled. Contact us if this looks wrong.
      </p>
    );
  }
  const current = TRACK_STEPS.indexOf(status as (typeof TRACK_STEPS)[number]);
  return (
    <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {TRACK_STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <li
            key={step}
            className={`flex items-center gap-1.5 text-xs ${
              done ? "font-semibold text-primary" : "text-muted-foreground"
            }`}
          >
            {done ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {STEP_LABEL[step]}
          </li>
        );
      })}
    </ol>
  );
}

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user?.id;

  const loadOrders = useServerFn(getMyOrders);
  const loadAddresses = useServerFn(getMyAddresses);
  const saveAddress = useServerFn(saveMyAddress);
  const removeAddress = useServerFn(deleteMyAddress);
  const makeDefault = useServerFn(setDefaultAddress);

  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => loadOrders({}) });
  const addresses = useQuery({ queryKey: ["my-addresses"], queryFn: () => loadAddresses({}) });

  // ---- Profile -------------------------------------------------------------
  const profile = useQuery({
    queryKey: ["my-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  useEffect(() => {
    if (profile.data) {
      setProfileForm({
        full_name: profile.data.full_name ?? "",
        phone: profile.data.phone ?? "",
      });
    }
  }, [profile.data]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("no-session");
      const payload = {
        full_name: profileForm.full_name.trim() || null,
        phone: profileForm.phone.trim() || null,
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
    },
    onError: () => toast.error("Could not update your profile"),
  });

  // ---- Wish list -----------------------------------------------------------
  const { ids: wishIds, toggle: toggleWish } = useWishlist();
  const { add } = useCart();
  const wishlist = useQuery({
    queryKey: ["wishlist-products", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(
          "id, product_id, created_at, products(id, name, slug, price, sale_price, old_price, sale_starts_at, sale_ends_at, image_url, image_alt, stock)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["wishlist-products", userId] });
  }, [wishIds.size, queryClient, userId]);

  // ---- Addresses -----------------------------------------------------------
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
            <h1 className="mt-1 font-display text-3xl font-bold">
              {profile.data?.full_name || session?.user?.email || "Welcome back"}
            </h1>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="orders">Orders &amp; tracking</TabsTrigger>
            <TabsTrigger value="wishlist">Wish list</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>

          {/* Orders & tracking */}
          <TabsContent value="orders" className="mt-6">
            {orders.isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : orders.isError ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm">
                <p className="text-muted-foreground">We could not load your orders.</p>
                <Button className="mt-4" variant="outline" onClick={() => orders.refetch()}>
                  Try again
                </Button>
              </div>
            ) : (orders.data ?? []).length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
                <p className="text-sm text-muted-foreground">You have no orders yet.</p>
                <Button className="mt-5" asChild>
                  <Link to="/shop">Start shopping</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-4">
                {(orders.data ?? []).map((order) => (
                  <li
                    key={order.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-base font-bold">{order.order_code}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toISOString().slice(0, 10)} ·{" "}
                          {order.area ?? "—"}
                        </p>
                      </div>
                      <Badge
                        className={
                          statusTone[order.status] ?? "bg-secondary text-secondary-foreground"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <OrderTimeline status={order.status} />
                    <Separator className="my-4" />
                    <ul className="space-y-2 text-sm">
                      {(order.order_items ?? []).map((item, idx) => (
                        <li key={idx} className="flex justify-between gap-3">
                          <span className="min-w-0 flex-1 text-muted-foreground">
                            {item.product_name}{" "}
                            <span className="text-foreground">× {item.quantity}</span>
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
          </TabsContent>

          {/* Wish list */}
          <TabsContent value="wishlist" className="mt-6">
            {wishlist.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : (wishlist.data ?? []).length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
                <p className="text-sm text-muted-foreground">
                  Your wish list is empty. Tap the heart on any product to save it here.
                </p>
                <Button className="mt-5" asChild>
                  <Link to="/shop">Browse products</Link>
                </Button>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {(wishlist.data ?? []).map((row) => {
                  const p = row.products;
                  if (!p) return null;
                  const price = Number(p.sale_price ?? p.price);
                  return (
                    <li
                      key={row.id}
                      className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
                    >
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary"
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.image_alt ?? p.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageOff className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/product/$slug"
                          params={{ slug: p.slug }}
                          className="font-display text-sm font-semibold hover:text-moss"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-1 font-display text-base font-bold text-primary">
                          {formatBDT(price)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={Number(p.stock ?? 0) <= 0}
                            onClick={() =>
                              add({
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                price,
                                image_url: p.image_url,
                                max_stock: Number(p.stock ?? 0),
                              })
                            }
                          >
                            {Number(p.stock ?? 0) <= 0 ? "Out of stock" : "Add to cart"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => toggleWish.mutate(p.id)}
                          >
                            <Heart className="mr-1.5 h-4 w-4" /> Remove
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="mt-6">
            <form
              className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Email</Label>
                <Input
                  id="p-email"
                  value={profile.data?.email ?? session?.user?.email ?? ""}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Full name</Label>
                <Input
                  id="p-name"
                  maxLength={80}
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone">Phone number</Label>
                <Input
                  id="p-phone"
                  inputMode="tel"
                  maxLength={15}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <Button type="submit" disabled={saveProfile.isPending}>
                {saveProfile.isPending ? "Saving…" : "Save profile"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Payment is collected on delivery, so no card details are ever stored.
              </p>
            </form>

            <form
              className="mt-5 max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
              onSubmit={(e) => {
                e.preventDefault();
                changePassword.mutate();
              }}
            >
              <h2 className="font-display text-lg font-bold">Change password</h2>
              <div className="space-y-1.5">
                <Label htmlFor="cur-pass">Current password</Label>
                <Input
                  id="cur-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, current: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pass">New password</Label>
                <Input
                  id="new-pass"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                  placeholder="At least 8 characters"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </TabsContent>

          {/* Addresses */}
          <TabsContent value="addresses" className="mt-6">
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
                  <li
                    key={a.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                  >
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
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

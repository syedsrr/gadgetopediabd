import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, LogOut, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/site/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { categoriesQuery, productsQuery, withCategories, type Category } from "@/lib/catalog";
import { PRODUCT_CSV_TEMPLATE, parseCsvObjects } from "@/lib/csv";
import { formatBDT } from "@/lib/format";
import { useIsAdmin, useSession } from "@/lib/useAdmin";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — gadgetOpedia n' Lifestyle" },
      { name: "description", content: "Manage products, categories and orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, loading } = useSession();
  const { data: isAdmin, isPending: checking } = useIsAdmin(session?.user.id);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }



  if (loading || !session || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-display text-2xl font-bold">Not authorised</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This account doesn't have administrator access. Ask the store owner to grant you the admin
          role.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Back to store</Link>
          </Button>
          <Button
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <Logo />
          <Badge variant="secondary" className="ml-2">
            Admin
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">View store</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="pt-6">
            <OrdersPanel />
          </TabsContent>
          <TabsContent value="products" className="pt-6">
            <ProductsPanel />
          </TabsContent>
          <TabsContent value="categories" className="pt-6">
            <CategoriesPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- Orders ---------------- */

function OrdersPanel() {
  const qc = useQueryClient();
  const { data: orders = [], isPending } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, quantity, unit_price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading orders…</p>;
  if (orders.length === 0)
    return <p className="text-sm text-muted-foreground">No orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-base font-bold">{o.order_code}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-lg font-bold text-primary">
                {formatBDT(o.total)}
              </span>
              <Select
                value={o.status}
                onValueChange={(v) => setStatus.mutate({ id: o.id, status: v as OrderStatus })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">{o.customer_name}</p>
              <p className="text-muted-foreground">{o.phone}</p>
              <p className="text-muted-foreground">
                {[o.area, o.address].filter(Boolean).join(", ")}
              </p>
              {o.note && <p className="mt-1 text-xs italic text-muted-foreground">“{o.note}”</p>}
            </div>
            <ul className="space-y-1 text-muted-foreground">
              {o.order_items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span>
                    {it.product_name} × {it.quantity}
                  </span>
                  <span>{formatBDT(Number(it.unit_price) * it.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 border-t border-border pt-1">
                <span>Delivery</span>
                <span>{formatBDT(o.delivery_fee)}</span>
              </li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Products ---------------- */

type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  category_id: string;
  price: string;
  old_price: string;
  stock: string;
  image_url: string;
  short_description: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
};

const emptyProduct: ProductForm = {
  name: "",
  slug: "",
  brand: "",
  category_id: "",
  price: "",
  old_price: "",
  stock: "0",
  image_url: "",
  short_description: "",
  description: "",
  is_active: true,
  is_featured: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ProductsPanel() {
  const qc = useQueryClient();
  const { data: products = [], isPending } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const productsWithCategory = useMemo(() => withCategories(products, categories), [products, categories]);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [csvText, setCsvText] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyProduct);


  const save = useMutation({
    mutationFn: async (f: ProductForm) => {
      const payload = {
        name: f.name.trim(),
        slug: f.slug.trim() || slugify(f.name),
        brand: f.brand.trim() || null,
        category_id: f.category_id || null,
        price: Number(f.price),
        old_price: f.old_price ? Number(f.old_price) : null,
        stock: Number(f.stock),
        image_url: f.image_url.trim() || null,
        short_description: f.short_description.trim() || null,
        description: f.description.trim() || null,
        is_active: f.is_active,
        is_featured: f.is_featured,
      };
      if (f.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Product saved");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase.from("products").update({ stock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productsWithCategory;
    return productsWithCategory.filter((p) =>
      [p.name, p.slug, p.brand, p.categories?.name].some((v) =>
        (v ?? "").toLowerCase().includes(q),
      ),
    );
  }, [productsWithCategory, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full sm:max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          {visible.length} of {products.length}
        </p>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" /> Import CSV
          </Button>
          <Button
            onClick={() => {
              setForm(emptyProduct);
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New product
          </Button>
        </div>
      </div>


      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            ) : (
              productsWithCategory.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.categories?.name ?? "—"}
                  </TableCell>
                  <TableCell>{formatBDT(p.price)}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => {
                        setForm({
                          id: p.id,
                          name: p.name,
                          slug: p.slug,
                          brand: p.brand ?? "",
                          category_id: p.category_id ?? "",
                          price: String(p.price),
                          old_price: p.old_price ? String(p.old_price) : "",
                          stock: String(p.stock),
                          image_url: p.image_url ?? "",
                          short_description: p.short_description ?? "",
                          description: p.description ?? "",
                          is_active: p.is_active,
                          is_featured: p.is_featured,
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${p.name}`}
                      className="text-muted-foreground hover:text-sale"
                      onClick={() => {
                        if (confirm(`Delete ${p.name}?`)) remove.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          <form
            id="product-form"
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.id ? f.slug : slugify(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-slug">Slug</Label>
                <Input
                  id="p-slug"
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-brand">Brand</Label>
                <Input
                  id="p-brand"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price (৳)</Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-old">Old price</Label>
                <Input
                  id="p-old"
                  type="number"
                  min="0"
                  value={form.old_price}
                  onChange={(e) => setForm((f) => ({ ...f, old_price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock</Label>
                <Input
                  id="p-stock"
                  type="number"
                  min="0"
                  required
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-img">Image URL</Label>
              <Input
                id="p-img"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="/images/p-example.jpg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-short">Short description</Label>
              <Input
                id="p-short"
                value={form.short_description}
                onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Full description</Label>
              <Textarea
                id="p-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-8 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
                />
                Featured
              </label>
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="product-form" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Categories ---------------- */

function CategoriesPanel() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [form, setForm] = useState({ name: "", slug: "", tagline: "", sort_order: "0" });
  const [editing, setEditing] = useState<Category | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        tagline: form.tagline.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Category saved");
      setForm({ name: "", slug: "", tagline: "", sort_order: "0" });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => {
                      setEditing(c);
                      setForm({
                        name: c.name,
                        slug: c.slug,
                        tagline: c.tagline ?? "",
                        sort_order: String(c.sort_order),
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${c.name}`}
                    className="text-muted-foreground hover:text-sale"
                    onClick={() => {
                      if (confirm(`Delete ${c.name}?`)) remove.mutate(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <form
        className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="font-display text-base font-bold">
          {editing ? "Edit category" : "Add category"}
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Name</Label>
          <Input
            id="c-name"
            required
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: editing ? f.slug : slugify(e.target.value),
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-slug">Slug</Label>
          <Input
            id="c-slug"
            required
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-tag">Tagline</Label>
          <Input
            id="c-tag"
            value={form.tagline}
            onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-sort">Sort order</Label>
          <Input
            id="c-sort"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setForm({ name: "", slug: "", tagline: "", sort_order: "0" });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

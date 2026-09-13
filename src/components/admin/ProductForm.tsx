import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Category, ProductStatus } from "@/lib/catalog";
import { saveProduct, type ImageInput, type SpecInput } from "@/lib/adminCatalog";
import { formatBDT, slugify } from "@/lib/format";
import { uploadProductImage, validateImageFile } from "@/lib/productImages";

type FormErrors = {
  name?: string;
  slug?: string;
  price?: string;
  sale_price?: string;
  stock?: string;
  category_id?: string;
  seo_description?: string;
};

type Draft = {
  name: string;
  slug: string;
  slugLocked: boolean;
  sku: string;
  brand: string;
  category_id: string;
  short_description: string;
  description: string;
  price: string;
  sale_price: string;
  sale_starts_at: string;
  sale_ends_at: string;
  stock: string;
  low_stock_threshold: string;
  allow_backorder: boolean;
  is_preorder: boolean;
  preorder_release_date: string;
  preorder_note: string;
  weight_kg: string;
  status: ProductStatus;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  sort_priority: string;
  seo_title: string;
  seo_description: string;
};

function emptyDraft(): Draft {
  return {
    name: "",
    slug: "",
    slugLocked: false,
    sku: "",
    brand: "",
    category_id: "",
    short_description: "",
    description: "",
    price: "",
    sale_price: "",
    sale_starts_at: "",
    sale_ends_at: "",
    stock: "0",
    low_stock_threshold: "5",
    allow_backorder: false,
    is_preorder: false,
    preorder_release_date: "",
    preorder_note: "",
    weight_kg: "",
    status: "draft",
    is_featured: false,
    is_new_arrival: false,
    is_best_seller: false,
    sort_priority: "0",
    seo_title: "",
    seo_description: "",
  };
}

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type ProductFormInitial = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  stock: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  is_preorder: boolean;
  preorder_release_date: string | null;
  preorder_note: string | null;
  weight_kg: number | null;
  status: ProductStatus;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  sort_priority: number;
  seo_title: string | null;
  seo_description: string | null;
  product_images?: { url: string; alt: string | null; is_primary: boolean; sort_order: number }[];
  product_specifications?: { name: string; value: string; sort_order: number }[];
};

export function ProductForm({
  initial,
  categories,
}: {
  initial?: ProductFormInitial | null;
  categories: Category[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Draft>(() => {
    if (!initial) return emptyDraft();
    return {
      name: initial.name,
      slug: initial.slug,
      slugLocked: true,
      sku: initial.sku ?? "",
      brand: initial.brand ?? "",
      category_id: initial.category_id ?? "",
      short_description: initial.short_description ?? "",
      description: initial.description ?? "",
      price: String(initial.price ?? ""),
      sale_price: initial.sale_price == null ? "" : String(initial.sale_price),
      sale_starts_at: toLocalInput(initial.sale_starts_at),
      sale_ends_at: toLocalInput(initial.sale_ends_at),
      stock: String(initial.stock ?? 0),
      low_stock_threshold: String(initial.low_stock_threshold ?? 5),
      allow_backorder: Boolean(initial.allow_backorder),
      is_preorder: Boolean(initial.is_preorder),
      preorder_release_date: initial.preorder_release_date ?? "",
      preorder_note: initial.preorder_note ?? "",
      weight_kg: initial.weight_kg == null ? "" : String(initial.weight_kg),
      status: initial.status,
      is_featured: initial.is_featured,
      is_new_arrival: Boolean(initial.is_new_arrival),
      is_best_seller: Boolean(initial.is_best_seller),
      sort_priority: String(initial.sort_priority ?? 0),
      seo_title: initial.seo_title ?? "",
      seo_description: initial.seo_description ?? "",
    };
  });

  const [images, setImages] = useState<ImageInput[]>(() =>
    [...(initial?.product_images ?? [])]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .map((i) => ({ url: i.url, alt: i.alt, is_primary: i.is_primary })),
  );
  const [specs, setSpecs] = useState<SpecInput[]>(() =>
    [...(initial?.product_specifications ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ name: s.name, value: s.value })),
  );
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function validate(): boolean {
    const next: FormErrors = {};
    if (draft.name.trim().length < 2) next.name = "Product name is required.";
    if (draft.name.trim().length > 160) next.name = "Keep the name under 160 characters.";
    const slug = draft.slug.trim() || slugify(draft.name);
    if (!/^[a-z0-9-]+$/.test(slug)) next.slug = "Use lowercase letters, numbers and dashes only.";
    const price = Number(draft.price);
    if (!draft.price.trim() || !Number.isFinite(price) || price <= 0)
      next.price = "Enter a price greater than 0.";
    if (draft.sale_price.trim()) {
      const sale = Number(draft.sale_price);
      if (!Number.isFinite(sale) || sale <= 0) next.sale_price = "Sale price must be a number.";
      else if (sale >= price) next.sale_price = "Sale price must be below the regular price.";
    }
    const stock = Number(draft.stock);
    if (!Number.isInteger(stock) || stock < 0) next.stock = "Stock must be 0 or more.";
    if (!draft.category_id) next.category_id = "Choose a category.";
    if (draft.seo_description.length > 160) next.seo_description = "Keep this under 160 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const save = useMutation({
    mutationFn: async (publish: boolean) => {
      const status: ProductStatus = publish ? "published" : draft.status;
      return saveProduct({
        id: initial?.id,
        name: draft.name.trim(),
        slug: (draft.slug.trim() || slugify(draft.name)).toLowerCase(),
        sku: draft.sku.trim() || null,
        brand: draft.brand.trim() || null,
        category_id: draft.category_id || null,
        subcategory_id: null,
        short_description: draft.short_description.trim() || null,
        description: draft.description.trim() || null,
        price: Number(draft.price),
        sale_price: draft.sale_price.trim() ? Number(draft.sale_price) : null,
        sale_starts_at: draft.sale_starts_at ? new Date(draft.sale_starts_at).toISOString() : null,
        sale_ends_at: draft.sale_ends_at ? new Date(draft.sale_ends_at).toISOString() : null,
        stock: Number(draft.stock),
        low_stock_threshold: Number(draft.low_stock_threshold || 5),
        allow_backorder: draft.allow_backorder,
        is_preorder: draft.is_preorder,
        preorder_release_date: draft.preorder_release_date || null,
        preorder_note: draft.preorder_note.trim() || null,
        weight_kg: draft.weight_kg.trim() ? Number(draft.weight_kg) : null,
        status,
        is_active: status !== "archived",
        is_featured: draft.is_featured,
        is_new_arrival: draft.is_new_arrival,
        is_best_seller: draft.is_best_seller,
        sort_priority: Number(draft.sort_priority || 0),
        seo_title: draft.seo_title.trim() || null,
        seo_description: draft.seo_description.trim() || null,
        images: images.map((img, i) => ({ ...img, is_primary: i === 0 })),
        specs,
      });
    },
    onSuccess: async (_id, publish) => {
      await queryClient.invalidateQueries();
      toast.success(publish ? "Product published" : "Product saved");
      navigate({ to: "/admin/products" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const invalid = validateImageFile(file);
        if (invalid) {
          toast.error(invalid);
          continue;
        }
        const uploaded = await uploadProductImage(file);
        setImages((prev) => [
          ...prev,
          { url: uploaded.url, alt: draft.name || file.name, is_primary: prev.length === 0 },
        ]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function moveImage(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next.map((img, i) => ({ ...img, is_primary: i === 0 }));
    });
  }

  const submit = (publish: boolean) => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    save.mutate(publish);
  };

  const busy = save.isPending || uploading;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" error={errors.name} className="sm:col-span-2">
              <Input
                value={draft.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    name: value,
                    slug: d.slugLocked ? d.slug : slugify(value),
                  }));
                }}
                placeholder="Turbo Table Fan 12 inch"
                maxLength={160}
              />
            </Field>
            <Field label="URL slug" error={errors.slug}>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value, slugLocked: true }))}
                placeholder="turbo-table-fan-12"
              />
            </Field>
            <Field label="SKU / product code">
              <Input
                value={draft.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="GO-FAN-001"
              />
            </Field>
            <Field label="Category" error={errors.category_id}>
              <Select
                value={draft.category_id}
                onValueChange={(v) => set("category_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Brand / manufacturer">
              <Input value={draft.brand} onChange={(e) => set("brand", e.target.value)} />
            </Field>
            <Field label="Short description" className="sm:col-span-2">
              <Input
                value={draft.short_description}
                onChange={(e) => set("short_description", e.target.value)}
                maxLength={200}
                placeholder="One line shown on product cards"
              />
            </Field>
            <Field label="Full description" className="sm:col-span-2">
              <Textarea
                rows={6}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Materials, features, warranty, what's in the box…"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing &amp; stock</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Regular price (BDT)" error={errors.price}>
              <Input
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </Field>
            <Field label="Sale price (optional)" error={errors.sale_price}>
              <Input
                inputMode="decimal"
                value={draft.sale_price}
                onChange={(e) => set("sale_price", e.target.value)}
              />
            </Field>
            <Field label="Sale starts">
              <Input
                type="datetime-local"
                value={draft.sale_starts_at}
                onChange={(e) => set("sale_starts_at", e.target.value)}
              />
            </Field>
            <Field label="Sale ends">
              <Input
                type="datetime-local"
                value={draft.sale_ends_at}
                onChange={(e) => set("sale_ends_at", e.target.value)}
              />
            </Field>
            <Field label="Stock quantity" error={errors.stock}>
              <Input
                inputMode="numeric"
                value={draft.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </Field>
            <Field label="Low stock warning at">
              <Input
                inputMode="numeric"
                value={draft.low_stock_threshold}
                onChange={(e) => set("low_stock_threshold", e.target.value)}
              />
            </Field>
            <Field label="Weight (kg)">
              <Input
                inputMode="decimal"
                value={draft.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Allow orders when out of stock</p>
                <p className="text-xs text-muted-foreground">Backorder / pre-order</p>
              </div>
              <Switch
                checked={draft.allow_backorder}
                onCheckedChange={(v) => set("allow_backorder", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Sell as pre-order</p>
                <p className="text-xs text-muted-foreground">
                  Shows a Pre-order badge and lists the product on the Pre-order page
                </p>
              </div>
              <Switch
                checked={draft.is_preorder}
                onCheckedChange={(v) => set("is_preorder", v)}
              />
            </div>
            {draft.is_preorder ? (
              <>
                <Field label="Expected arrival date">
                  <Input
                    type="date"
                    value={draft.preorder_release_date}
                    onChange={(e) => set("preorder_release_date", e.target.value)}
                  />
                </Field>
                <Field label="Pre-order note">
                  <Input
                    value={draft.preorder_note}
                    onChange={(e) => set("preorder_note", e.target.value)}
                    placeholder="e.g. Ships within 7 days of arrival"
                  />
                </Field>
              </>
            ) : null}
            {Number(draft.stock || 0) <= 0 && !draft.allow_backorder && !draft.is_preorder ? (
              <p className="rounded-xl border border-sale/30 bg-sale/10 px-4 py-3 text-xs font-medium text-sale sm:col-span-2">
                With no stock left and backorders off, this product shows as “Sold out” on the store
                and appears on the Sold out page. Turn on pre-order to keep taking orders.
              </p>
            ) : null}
            {draft.sale_price && Number(draft.sale_price) < Number(draft.price) ? (
              <p className="text-xs text-moss sm:col-span-2">
                Customers will pay {formatBDT(draft.sale_price)} instead of{" "}
                {formatBDT(draft.price)}.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-1.5 h-4 w-4" />
              )}
              Upload images
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP or AVIF up to 8 MB. The first image is the main photo.
            </p>

            {images.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No images yet.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {images.map((img, i) => (
                  <li key={img.url} className="rounded-xl border border-border p-3">
                    <div className="flex gap-3">
                      <img
                        src={img.url}
                        alt={img.alt ?? ""}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        {i === 0 && (
                          <Badge className="gap-1">
                            <Star className="h-3 w-3" /> Main
                          </Badge>
                        )}
                        <Input
                          value={img.alt ?? ""}
                          placeholder="Image description (alt text)"
                          onChange={(e) =>
                            setImages((prev) =>
                              prev.map((x, xi) =>
                                xi === i ? { ...x, alt: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Move up"
                            onClick={() => moveImage(i, -1)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Move down"
                            onClick={() => moveImage(i, 1)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Remove image"
                            onClick={() =>
                              setImages((prev) =>
                                prev
                                  .filter((_, xi) => xi !== i)
                                  .map((x, xi) => ({ ...x, is_primary: xi === 0 })),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4 text-sale" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Label (e.g. Power)"
                  value={spec.name}
                  onChange={(e) =>
                    setSpecs((prev) =>
                      prev.map((s, si) => (si === i ? { ...s, name: e.target.value } : s)),
                    )
                  }
                />
                <Input
                  placeholder="Value (e.g. 55 W)"
                  value={spec.value}
                  onChange={(e) =>
                    setSpecs((prev) =>
                      prev.map((s, si) => (si === i ? { ...s, value: e.target.value } : s)),
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Remove specification"
                  onClick={() => setSpecs((prev) => prev.filter((_, si) => si !== i))}
                >
                  <Trash2 className="h-4 w-4 text-sale" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSpecs((prev) => [...prev, { name: "", value: "" }])}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add specification
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Status">
              <Select value={draft.status} onValueChange={(v) => set("status", v as ProductStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (hidden)</SelectItem>
                  <SelectItem value="published">Published (live)</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Toggle
              label="Featured on homepage"
              checked={draft.is_featured}
              onChange={(v) => set("is_featured", v)}
            />
            <Toggle
              label="New arrival"
              checked={draft.is_new_arrival}
              onChange={(v) => set("is_new_arrival", v)}
            />
            <Toggle
              label="Best seller"
              checked={draft.is_best_seller}
              onChange={(v) => set("is_best_seller", v)}
            />
            <Field label="Sort priority (higher shows first)">
              <Input
                inputMode="numeric"
                value={draft.sort_priority}
                onChange={(e) => set("sort_priority", e.target.value)}
              />
            </Field>
            <Separator />
            <div className="flex flex-col gap-2">
              <Button disabled={busy} onClick={() => submit(true)}>
                {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {initial ? "Save & publish" : "Publish product"}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => submit(false)}>
                Save {draft.status === "published" ? "changes" : "as draft"}
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => navigate({ to: "/admin/products" })}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Page title">
              <Input
                value={draft.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
                maxLength={70}
                placeholder={draft.name}
              />
            </Field>
            <Field label="Meta description" error={errors.seo_description}>
              <Textarea
                rows={4}
                value={draft.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
                maxLength={160}
                placeholder={draft.short_description}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {draft.seo_description.length}/160 characters
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-sale">{error}</p>}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Category, Product, ProductStatus } from "@/lib/catalog";
import { slugify } from "@/lib/format";

export type AdminProduct = Product & {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
};

export type ProductFilters = {
  search: string;
  categoryId: string; // "all" | uuid
  brand: string; // "all" | brand
  stock: "all" | "in" | "low" | "out";
  status: "all" | ProductStatus;
  featured: "all" | "featured" | "regular";
  sort: "recent" | "updated" | "name" | "price_asc" | "price_desc" | "stock_asc";
  page: number;
  pageSize: number;
};

export const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  categoryId: "all",
  brand: "all",
  stock: "all",
  status: "all",
  featured: "all",
  sort: "updated",
  page: 1,
  pageSize: 20,
};

const LIST_COLUMNS =
  "id, name, slug, sku, brand, price, sale_price, stock, low_stock_threshold, status, is_featured, is_active, image_url, category_id, updated_at, categories(id, name, slug)";

/** Server-side filtered + paginated product list for the admin table. */
export function adminProductsQuery(filters: ProductFilters) {
  return queryOptions({
    queryKey: ["admin-products", filters],
    queryFn: async (): Promise<{ rows: AdminProduct[]; total: number }> => {
      let q = supabase.from("products").select(LIST_COLUMNS, { count: "exact" });

      const search = filters.search.trim();
      if (search) {
        const like = `%${search}%`;
        q = q.or(
          `name.ilike.${like},sku.ilike.${like},brand.ilike.${like},slug.ilike.${like},category.ilike.${like}`,
        );
      }
      if (filters.categoryId !== "all") q = q.eq("category_id", filters.categoryId);
      if (filters.brand !== "all") q = q.eq("brand", filters.brand);
      if (filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.featured !== "all") q = q.eq("is_featured", filters.featured === "featured");
      if (filters.stock === "out") q = q.lte("stock", 0);
      if (filters.stock === "in") q = q.gt("stock", 0);
      if (filters.stock === "low") q = q.gt("stock", 0).lte("stock", 5);

      if (filters.sort === "recent") q = q.order("created_at", { ascending: false });
      else if (filters.sort === "updated") q = q.order("updated_at", { ascending: false });
      else if (filters.sort === "name") q = q.order("name", { ascending: true });
      else if (filters.sort === "price_asc") q = q.order("price", { ascending: true });
      else if (filters.sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("stock", { ascending: true });

      const from = (filters.page - 1) * filters.pageSize;
      const { data, error, count } = await q.range(from, from + filters.pageSize - 1);
      if (error) throw error;
      return { rows: (data ?? []) as unknown as AdminProduct[], total: count ?? 0 };
    },
  });
}

/** All categories, including inactive ones, for admin management. */
export const adminCategoriesQuery = queryOptions({
  queryKey: ["admin-categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const adminBrandsQuery = queryOptions({
  queryKey: ["admin-brands"],
  queryFn: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("brand")
      .not("brand", "is", null)
      .limit(2000);
    if (error) throw error;
    return [...new Set((data ?? []).map((r) => r.brand).filter(Boolean) as string[])].sort();
  },
});

async function countProducts(build: (q: any) => any) {
  const { count, error } = await build(
    supabase.from("products").select("id", { count: "exact", head: true }),
  );
  if (error) throw error;
  return count ?? 0;
}

export const dashboardStatsQuery = queryOptions({
  queryKey: ["admin-dashboard-stats"],
  queryFn: async () => {
    const [total, published, draft, archived, outOfStock, lowStock, featured, orders] =
      await Promise.all([
        countProducts((q) => q),
        countProducts((q) => q.eq("status", "published")),
        countProducts((q) => q.eq("status", "draft")),
        countProducts((q) => q.eq("status", "archived")),
        countProducts((q) => q.lte("stock", 0)),
        countProducts((q) => q.gt("stock", 0).lte("stock", 5)),
        countProducts((q) => q.eq("is_featured", true)),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .then(({ count }) => count ?? 0),
      ]);
    return { total, published, draft, archived, outOfStock, lowStock, featured, orders };
  },
});

/* ------------------------------- mutations ------------------------------- */

export type SpecInput = { name: string; value: string };
export type ImageInput = { url: string; alt: string | null; is_primary: boolean };

export type ProductInput = {
  id?: string | undefined;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  stock: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  weight_kg: number | null;
  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  sort_priority: number;
  seo_title: string | null;
  seo_description: string | null;
  images: ImageInput[];
  specs: SpecInput[];
};

function friendly(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    if (error.message.includes("sku")) return new Error("That SKU is already used by another product.");
    if (error.message.includes("slug")) return new Error("That URL slug is already in use.");
  }
  return new Error(error.message);
}

export async function saveProduct(input: ProductInput) {
  const categoryName = input.category_id
    ? ((
        await supabase.from("categories").select("name").eq("id", input.category_id).maybeSingle()
      ).data?.name ?? null)
    : null;

  const primary = input.images.find((i) => i.is_primary) ?? input.images[0] ?? null;

  const row = {
    name: input.name,
    title: input.name,
    slug: input.slug,
    sku: input.sku,
    brand: input.brand,
    manufacturer: input.brand,
    category_id: input.category_id,
    subcategory_id: input.subcategory_id,
    category: categoryName,
    short_description: input.short_description,
    description: input.description,
    specs_description: input.description,
    price: input.price,
    sale_price: input.sale_price,
    sale_starts_at: input.sale_starts_at,
    sale_ends_at: input.sale_ends_at,
    stock: input.stock,
    low_stock_threshold: input.low_stock_threshold,
    allow_backorder: input.allow_backorder,
    weight_kg: input.weight_kg,
    status: input.status,
    is_active: input.is_active,
    is_featured: input.is_featured,
    is_new_arrival: input.is_new_arrival,
    is_best_seller: input.is_best_seller,
    sort_priority: input.sort_priority,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    image_url: primary?.url ?? null,
    image_alt: primary?.alt ?? input.name,
  };

  let productId = input.id;
  if (productId) {
    const { error } = await supabase.from("products").update(row).eq("id", productId);
    if (error) throw friendly(error);
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) throw friendly(error);
    productId = data.id;
  }

  // Replace gallery + specifications (small sets, keeps ordering exact).
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (input.images.length > 0) {
    const { error } = await supabase.from("product_images").insert(
      input.images.map((img, i) => ({
        product_id: productId!,
        url: img.url,
        alt: img.alt ?? input.name,
        sort_order: i,
        is_primary: img.is_primary,
      })),
    );
    if (error) throw friendly(error);
  }

  await supabase.from("product_specifications").delete().eq("product_id", productId);
  const specs = input.specs.filter((s) => s.name.trim() && s.value.trim());
  if (specs.length > 0) {
    const { error } = await supabase.from("product_specifications").insert(
      specs.map((s, i) => ({
        product_id: productId!,
        name: s.name.trim(),
        value: s.value.trim(),
        sort_order: i,
      })),
    );
    if (error) throw friendly(error);
  }

  return productId!;
}

export async function loadProductForEdit(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_images(id, url, alt, sort_order, is_primary), product_specifications(id, name, value, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function productForEditQuery(id: string) {
  return queryOptions({
    queryKey: ["admin-product", id],
    queryFn: () => loadProductForEdit(id),
  });
}

/** Hard-deletes only when no order references the product; otherwise archives it. */
export async function deleteOrArchiveProduct(id: string): Promise<"deleted" | "archived"> {
  const { count, error: refError } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
  if (refError) throw refError;

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("products")
      .update({ status: "archived", is_active: false, is_featured: false })
      .eq("id", id);
    if (error) throw friendly(error);
    return "archived";
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw friendly(error);
  return "deleted";
}

export async function duplicateProduct(id: string): Promise<string> {
  const source = await loadProductForEdit(id);
  if (!source) throw new Error("Product not found");

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const name = `${source.name} (copy)`;
  const { product_images, product_specifications, id: _id, created_at, updated_at, ...rest } =
    source as any;

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...rest,
      name,
      title: name,
      slug: `${slugify(source.slug)}-copy-${suffix.toLowerCase()}`,
      sku: source.sku ? `${source.sku}-${suffix}` : `GO-${suffix}`,
      status: "draft" as ProductStatus,
      is_featured: false,
    })
    .select("id")
    .single();
  if (error) throw friendly(error);

  if (product_images?.length) {
    await supabase.from("product_images").insert(
      product_images.map((img: any, i: number) => ({
        product_id: data.id,
        url: img.url,
        alt: img.alt,
        sort_order: img.sort_order ?? i,
        is_primary: img.is_primary,
      })),
    );
  }
  if (product_specifications?.length) {
    await supabase.from("product_specifications").insert(
      product_specifications.map((s: any, i: number) => ({
        product_id: data.id,
        name: s.name,
        value: s.value,
        sort_order: s.sort_order ?? i,
      })),
    );
  }

  return data.id;
}

export async function updateStock(id: string, stock: number) {
  const { error } = await supabase.from("products").update({ stock }).eq("id", id);
  if (error) throw friendly(error);
}

export async function setProductStatus(id: string, status: ProductStatus) {
  const { error } = await supabase
    .from("products")
    .update({ status, is_active: status !== "archived" })
    .eq("id", id);
  if (error) throw friendly(error);
}

export async function saveCategory(input: {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}) {
  const { id, ...row } = input;
  if (id) {
    const { error } = await supabase.from("categories").update(row).eq("id", id);
    if (error) throw friendly(error);
  } else {
    const { error } = await supabase.from("categories").insert(row);
    if (error) throw friendly(error);
  }
}

export async function deleteCategory(id: string) {
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0) {
    throw new Error(
      `This category still has ${count} product${count === 1 ? "" : "s"}. Move them first, or mark the category inactive.`,
    );
  }
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw friendly(error);
}

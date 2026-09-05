import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductSpec = Database["public"]["Tables"]["product_specifications"]["Row"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];

export type ProductWithCategory = Product & {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
};

export type ProductFull = ProductWithCategory & {
  product_images: ProductImage[];
  product_specifications: ProductSpec[];
};

/** Columns the storefront grid needs — keeps payloads small. */
const CARD_COLUMNS =
  "id, name, slug, sku, brand, price, sale_price, old_price, sale_starts_at, sale_ends_at, stock, allow_backorder, low_stock_threshold, image_url, image_alt, short_description, description, category_id, category, is_featured, is_new_arrival, is_best_seller, sort_priority, status, is_active, created_at";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

/** Published, visible products only — the storefront source of truth. */
export const productsQuery = queryOptions({
  queryKey: ["products", "published"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(CARD_COLUMNS)
      .eq("is_active", true)
      .eq("status", "published")
      .order("sort_priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});

export function withCategories(
  products: Product[],
  categories: Category[],
): ProductWithCategory[] {
  const map = new Map(categories.map((c) => [c.id, c]));
  return products.map((p) => ({
    ...p,
    categories: p.category_id ? (map.get(p.category_id) ?? null) : null,
  }));
}

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<ProductFull | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "*, categories!products_category_id_fkey(id, name, slug), product_images(id, url, alt, sort_order, is_primary), product_specifications(id, name, value, sort_order)",
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const full = data as unknown as ProductFull;
      return {
        ...full,
        product_images: [...(full.product_images ?? [])].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
        ),
        product_specifications: [...(full.product_specifications ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      };
    },
  });
}

export const DELIVERY_FEE = 70;

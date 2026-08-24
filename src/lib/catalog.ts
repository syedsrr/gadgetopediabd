import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductWithCategory = Product & {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<ProductWithCategory[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(id, name, slug)")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ProductWithCategory[];
  },
});

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<ProductWithCategory | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(id, name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProductWithCategory | null;
    },
  });
}

export const DELIVERY_FEE = 70;

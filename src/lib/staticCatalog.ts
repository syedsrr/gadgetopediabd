import rawProducts from "@/data/products.json";

import type { ProductWithCategory } from "@/lib/catalog";

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  category_slug: string;
  brand: string | null;
  details: string;
  short_description: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  image_url: string | null;
  is_featured: boolean;
};

const raw = rawProducts as RawProduct[];

/** All listed products from src/data/products.json — never sliced or capped. */
export const staticProducts: ProductWithCategory[] = raw.map((p) => ({
  id: p.id,
  name: p.name,
  title: p.name,
  slug: p.slug,
  brand: p.brand,
  manufacturer: p.brand,
  price: p.price,
  old_price: p.old_price,
  stock: p.stock,
  image_url: p.image_url,
  short_description: p.short_description,
  description: p.details,
  specs_description: p.details,
  is_active: true,
  is_featured: p.is_featured,
  category: p.category,
  category_id: p.category_slug,
  weight_kg: null,
  created_at: new Date(2026, 0, 1).toISOString(),
  updated_at: new Date(2026, 0, 1).toISOString(),
  categories: { id: p.category_slug, name: p.category, slug: p.category_slug },
}));

export const staticCategories = Array.from(
  new Map(staticProducts.map((p) => [p.categories!.slug, p.categories!])).values(),
);

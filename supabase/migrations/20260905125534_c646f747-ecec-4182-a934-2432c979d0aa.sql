-- product status enum
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS sale_price numeric,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS sale_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS allow_backorder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status public.product_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_new_arrival boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON public.products (lower(sku)) WHERE sku IS NOT NULL;

-- search / filter indexes
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status, is_active);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON public.products (lower(name));
CREATE INDEX IF NOT EXISTS products_created_idx ON public.products (created_at DESC);

-- product images
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product images public read" ON public.product_images FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active AND p.status = 'published'));
CREATE POLICY "product images admin all" ON public.product_images FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images (product_id, sort_order);
CREATE TRIGGER product_images_touch BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- product specifications
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_specifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_specifications TO authenticated;
GRANT ALL ON public.product_specifications TO service_role;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product specs public read" ON public.product_specifications FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active AND p.status = 'published'));
CREATE POLICY "product specs admin all" ON public.product_specifications FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS product_specs_product_idx ON public.product_specifications (product_id, sort_order);
CREATE TRIGGER product_specs_touch BEFORE UPDATE ON public.product_specifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- storefront reads only published products
DROP POLICY IF EXISTS "products public read" ON public.products;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated
  USING (is_active = true AND status = 'published');

-- generated SKUs for existing rows
UPDATE public.products
SET sku = 'GO-' || upper(substr(replace(id::text,'-',''),1,8))
WHERE sku IS NULL;
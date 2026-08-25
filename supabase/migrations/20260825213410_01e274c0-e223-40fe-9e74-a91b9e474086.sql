ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS manufacturer text,
  ADD COLUMN IF NOT EXISTS specs_description text;

UPDATE public.products
SET
  title = name,
  manufacturer = brand,
  specs_description = COALESCE(description, short_description);

UPDATE public.products p
SET category = c.name
FROM public.categories c
WHERE p.category_id = c.id;

COMMENT ON COLUMN public.products.title IS 'Display title for product cards and specs drawer';
COMMENT ON COLUMN public.products.category IS 'Denormalized category label for product cards';
COMMENT ON COLUMN public.products.weight_kg IS 'Gross weight in kilograms';
COMMENT ON COLUMN public.products.manufacturer IS 'Manufacturer or brand name';
COMMENT ON COLUMN public.products.specs_description IS 'Detailed technical specifications and product details';
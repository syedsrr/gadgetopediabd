ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_preorder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preorder_release_date date,
  ADD COLUMN IF NOT EXISTS preorder_note text;

CREATE INDEX IF NOT EXISTS products_preorder_idx
  ON public.products (is_preorder, preorder_release_date)
  WHERE is_preorder = true;
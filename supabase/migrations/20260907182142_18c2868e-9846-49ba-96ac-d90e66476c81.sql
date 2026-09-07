-- Link orders to buyers
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_phone_idx ON public.orders(phone);

-- Normalized phone of the current user (from auth metadata or profile), for legacy order matching
CREATE OR REPLACE FUNCTION private.current_user_phones()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT array_remove(ARRAY[
    u.phone,
    u.raw_user_meta_data->>'phone'
  ], NULL)
  FROM auth.users u
  WHERE u.id = auth.uid()
$$;

REVOKE ALL ON FUNCTION private.current_user_phones() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_phones() TO authenticated, service_role;

CREATE POLICY "orders own read" ON public.orders
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (
    user_id IS NULL
    AND regexp_replace(phone, '[^0-9]', '', 'g') IN (
      SELECT regexp_replace(p, '[^0-9]', '', 'g') FROM unnest(private.current_user_phones()) AS p
    )
  )
);

CREATE POLICY "order items own read" ON public.order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR (
          o.user_id IS NULL
          AND regexp_replace(o.phone, '[^0-9]', '', 'g') IN (
            SELECT regexp_replace(p, '[^0-9]', '', 'g') FROM unnest(private.current_user_phones()) AS p
          )
        )
      )
  )
);

-- Saved addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  area text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_addresses_user_id_idx ON public.customer_addresses(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses own all" ON public.customer_addresses
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER customer_addresses_touch
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
-- Guest checkout now goes through a trusted server function using the service role,
-- so anonymous clients no longer need insert access to orders.
DROP POLICY IF EXISTS "orders guest insert" ON public.orders;
DROP POLICY IF EXISTS "order items guest insert" ON public.order_items;

REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.order_items FROM anon;

GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
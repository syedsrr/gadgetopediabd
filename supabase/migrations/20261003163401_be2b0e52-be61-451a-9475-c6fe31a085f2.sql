CREATE TABLE public.market_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'manual',
  product_count integer NOT NULL DEFAULT 0,
  report text NOT NULL
);
GRANT SELECT ON public.market_reports TO authenticated;
GRANT ALL ON public.market_reports TO service_role;
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read market reports" ON public.market_reports FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
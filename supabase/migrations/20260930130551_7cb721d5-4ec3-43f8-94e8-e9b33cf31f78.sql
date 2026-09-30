DROP POLICY IF EXISTS "reviews public read" ON public.product_reviews;
CREATE POLICY "reviews public read for visible products" ON public.product_reviews
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_reviews.product_id));
CREATE POLICY "reviews own or admin read" ON public.product_reviews
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
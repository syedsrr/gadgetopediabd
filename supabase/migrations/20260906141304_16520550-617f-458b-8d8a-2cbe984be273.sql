DROP POLICY IF EXISTS "product images read" ON storage.objects;

CREATE POLICY "product images read published"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'product-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.product_images pi
      JOIN public.products p ON p.id = pi.product_id
      WHERE p.is_active AND p.status = 'published'
        AND pi.url LIKE '%' || storage.objects.name || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.is_active AND p.status = 'published'
        AND p.image_url LIKE '%' || storage.objects.name || '%'
    )
  )
);

CREATE POLICY "product images admin read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images' AND private.has_role(auth.uid(), 'admin'::app_role));
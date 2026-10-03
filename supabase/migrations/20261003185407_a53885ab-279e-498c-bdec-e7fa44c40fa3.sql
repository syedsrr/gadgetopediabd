CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role permissions read own roles" ON public.role_permissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = role_permissions.role) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "role permissions admin write" ON public.role_permissions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;

CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission)
$$;

INSERT INTO public.role_permissions (role, permission) VALUES
 ('admin','marketing.view'),('admin','marketing.analytics'),('admin','marketing.ai'),('admin','marketing.recommendations'),
 ('admin','marketing.approve'),('admin','marketing.reports'),('admin','marketing.settings'),('admin','marketing.audit')
ON CONFLICT DO NOTHING;
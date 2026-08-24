-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- new user handler: profile + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_admins int;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO existing_admins FROM public.user_roles WHERE role = 'admin';
  IF existing_admins = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Catalog
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "categories admin all" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  brand text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  old_price numeric(10,2) CHECK (old_price >= 0),
  image_url text,
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products (category_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "products admin all" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE DEFAULT ('GO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  area text,
  note text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders guest insert" ON public.orders FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity int NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items guest insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order items admin read" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "order items admin write" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO public.categories (name, slug, tagline, image_url, sort_order) VALUES
  ('Smart Watches', 'smart-watches', 'Track every move in style', '/images/p-pulse-watch.jpg', 1),
  ('Earbuds & Audio', 'earbuds-audio', 'Sound that follows you', '/images/p-buds-air.jpg', 2),
  ('Power & Charging', 'power-charging', 'Never run out of juice', '/images/p-powerbank.jpg', 3),
  ('Phone Accessories', 'phone-accessories', 'Small upgrades, big difference', '/images/p-magstand.jpg', 4),
  ('Home & Kitchen', 'home-kitchen', 'Smarter everyday living', '/images/p-kettle.jpg', 5),
  ('Lifestyle & Fitness', 'lifestyle-fitness', 'Move, carry, unwind', '/images/p-daypack.jpg', 6);

-- Seed products
INSERT INTO public.products (category_id, name, slug, short_description, description, brand, price, old_price, image_url, stock, is_featured) VALUES
  ((SELECT id FROM public.categories WHERE slug='smart-watches'), 'GO Pulse 3 Smart Watch', 'go-pulse-3-smart-watch', '1.85" HD display, 7-day battery, 100+ sports modes', 'The GO Pulse 3 packs a 1.85" HD always-on display, continuous heart-rate and SpO2 tracking, 100+ sports modes and up to 7 days of real-world battery life. IP68 water resistant with Bluetooth calling.', 'gadgetOpedia', 4499, 5999, '/images/p-pulse-watch.jpg', 42, true),
  ((SELECT id FROM public.categories WHERE slug='smart-watches'), 'GO Aura AMOLED Watch', 'go-aura-amoled-watch', 'AMOLED always-on, aluminium body, AI coach', 'A premium aluminium-body smartwatch with a razor-sharp AMOLED panel, sleep staging, stress tracking and an on-device AI coach that adapts to your week.', 'gadgetOpedia', 6290, 7990, '/images/p-aura-watch.jpg', 25, true),
  ((SELECT id FROM public.categories WHERE slug='earbuds-audio'), 'GO Buds Air Pro', 'go-buds-air-pro', 'Hybrid ANC, 38h total playtime, low-latency gaming', 'Hybrid active noise cancellation up to 42dB, transparency mode, four-mic ENC for calls and a 45ms low-latency gaming mode. 38 hours total playtime with the case.', 'gadgetOpedia', 2990, 3990, '/images/p-buds-air.jpg', 88, true),
  ((SELECT id FROM public.categories WHERE slug='earbuds-audio'), 'GO Wave Mini Soundbar', 'go-wave-mini-soundbar', '30W stereo, Bluetooth 5.3, TWS pairing', 'A compact desktop soundbar with 30W of stereo output, dual passive bass radiators, Bluetooth 5.3, AUX and USB playback plus TWS pairing for a true stereo pair.', 'gadgetOpedia', 3450, 4500, '/images/p-soundbar.jpg', 31, false),
  ((SELECT id FROM public.categories WHERE slug='power-charging'), 'GO Charge 20K Power Bank', 'go-charge-20k-power-bank', '20000mAh, 22.5W fast charge, digital display', 'Charge a phone up to four times over. 20000mAh of Li-polymer cells, 22.5W bi-directional fast charging, USB-C PD, dual USB-A and a crisp digital battery readout.', 'gadgetOpedia', 2190, 2790, '/images/p-powerbank.jpg', 64, true),
  ((SELECT id FROM public.categories WHERE slug='power-charging'), 'GO Dash 65W GaN Charger', 'go-dash-65w-gan-charger', 'GaN III, 3 ports, laptop-ready', 'GaN III internals keep this 65W charger pocket sized while powering a laptop, phone and earbuds at once through two USB-C PD ports and one USB-A.', 'gadgetOpedia', 1890, 2400, '/images/p-charger.jpg', 57, false),
  ((SELECT id FROM public.categories WHERE slug='phone-accessories'), 'GO Grip Magnetic Stand', 'go-grip-magnetic-stand', 'Alloy magnetic desk stand, 360° rotation', 'A machined aluminium magnetic stand with a strong N52 magnet array, 360° rotation and adjustable tilt for handsfree video, filming and charging.', 'gadgetOpedia', 990, 1300, '/images/p-magstand.jpg', 120, false),
  ((SELECT id FROM public.categories WHERE slug='phone-accessories'), 'GO Shield 9H Glass Guard', 'go-shield-9h-glass-guard', '9H tempered glass, oleophobic, dust-free kit', 'Edge-to-edge 9H tempered glass with an oleophobic anti-fingerprint layer and a dust-removal application kit for a bubble-free fit every time.', 'gadgetOpedia', 350, 500, '/images/p-glass.jpg', 300, false),
  ((SELECT id FROM public.categories WHERE slug='home-kitchen'), 'GO Brew Electric Kettle', 'go-brew-electric-kettle', '1.7L glass body, 1800W, auto shut-off', 'Borosilicate glass body with a stainless steel base, 1800W rapid boil, blue LED ring, boil-dry protection and automatic shut-off.', 'gadgetOpedia', 2650, 3200, '/images/p-kettle.jpg', 40, false),
  ((SELECT id FROM public.categories WHERE slug='home-kitchen'), 'GO Fresh H13 Air Purifier', 'go-fresh-h13-air-purifier', 'True HEPA H13, 30m² coverage, 24dB sleep mode', 'A three-stage True HEPA H13 filtration system captures 99.97% of particles down to 0.3 microns across rooms up to 30m², with a whisper-quiet 24dB sleep mode.', 'gadgetOpedia', 7900, 9500, '/images/p-purifier.jpg', 18, true),
  ((SELECT id FROM public.categories WHERE slug='lifestyle-fitness'), 'GO Move Fitness Band', 'go-move-fitness-band', 'Slim band, 14-day battery, sleep & SpO2', 'A featherweight 24g fitness band with 14-day battery life, all-day SpO2, sleep quality scoring and 60+ workout profiles.', 'gadgetOpedia', 1990, 2500, '/images/p-band.jpg', 95, false),
  ((SELECT id FROM public.categories WHERE slug='lifestyle-fitness'), 'GO Trek 22L Daypack', 'go-trek-22l-daypack', 'Water-repellent, 16" laptop sleeve, USB pass-through', 'A 22L everyday carry pack in water-repellent recycled ripstop, with a padded 16" laptop sleeve, hidden anti-theft pocket and USB charging pass-through.', 'gadgetOpedia', 2450, 3100, '/images/p-daypack.jpg', 46, true);
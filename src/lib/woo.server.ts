// @ts-nocheck -- loosely typed WooCommerce JSON mapping
// WooCommerce REST API (v3) compatibility layer so tools like MoveDrop can
// connect to this store. Server-only.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { slugify } from "@/lib/format";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra },
  });
}

export const options = () => new Response(null, { status: 204, headers: CORS });

function wooError(code: string, message: string, status: number) {
  return json({ code, message, data: { status } }, status);
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function authorized(request: Request, url: URL) {
  const key = process.env.WC_CONSUMER_KEY ?? "";
  const secret = process.env.WC_CONSUMER_SECRET ?? "";
  if (!key || !secret) return false;
  let ck = url.searchParams.get("consumer_key") ?? "";
  let cs = url.searchParams.get("consumer_secret") ?? "";
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("basic ")) {
    try {
      const [u, ...p] = atob(auth.slice(6).trim()).split(":");
      ck = u ?? "";
      cs = p.join(":");
    } catch {
      /* ignore */
    }
  }
  return safeEqual(ck, key) && safeEqual(cs, secret);
}

export function discovery(origin: string) {
  return json({
    name: "Gadgetopedia n' Lifestyle",
    description: "Gadgetopedia store",
    url: origin,
    home: origin,
    gmt_offset: 6,
    timezone_string: "Asia/Dhaka",
    namespaces: ["wp/v2", "wc/v3", "wc/v2", "wc/v1"],
    authentication: [],
    routes: {},
  });
}

const STATUS_TO_WOO: Record<string, string> = {
  pending: "pending",
  confirmed: "processing",
  shipped: "on-hold",
  delivered: "completed",
  cancelled: "cancelled",
};
const WOO_TO_STATUS: Record<string, string> = {
  pending: "pending",
  processing: "confirmed",
  "on-hold": "shipped",
  completed: "delivered",
  cancelled: "cancelled",
  refunded: "cancelled",
  failed: "cancelled",
};

type Row = Record<string, any>;

function toWooProduct(p: Row, origin: string, images: Row[] = []) {
  const regular = p.old_price && p.old_price > p.price ? p.old_price : p.price;
  const onSale = !!(p.sale_price || (p.old_price && p.old_price > p.price));
  const imgs = images.length
    ? images.map((i, n) => ({ id: n + 1, src: i.url, name: i.alt ?? "", alt: i.alt ?? "" }))
    : p.image_url
      ? [{ id: 1, src: p.image_url.startsWith("http") ? p.image_url : origin + p.image_url, name: p.name, alt: p.image_alt ?? "" }]
      : [];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    permalink: `${origin}/product/${p.slug}`,
    date_created: p.created_at,
    type: "simple",
    status: p.status === "published" ? "publish" : p.status === "draft" ? "draft" : "private",
    featured: !!p.is_featured,
    description: p.description ?? "",
    short_description: p.short_description ?? "",
    sku: p.sku ?? "",
    price: String(p.sale_price ?? p.price),
    regular_price: String(regular),
    sale_price: p.sale_price ? String(p.sale_price) : "",
    on_sale: onSale,
    manage_stock: true,
    stock_quantity: p.stock,
    stock_status: p.stock > 0 ? "instock" : p.allow_backorder || p.is_preorder ? "onbackorder" : "outofstock",
    backorders: p.allow_backorder ? "notify" : "no",
    weight: p.weight_kg ? String(p.weight_kg) : "",
    categories: p.category_id ? [{ id: p.category_id, name: p.category ?? "", slug: slugify(p.category ?? "") }] : [],
    images: imgs,
    attributes: [],
    variations: [],
    meta_data: [],
  };
}

function toWooOrder(o: Row, items: Row[]) {
  const [first, ...rest] = (o.customer_name ?? "").split(" ");
  const addr = { first_name: first ?? "", last_name: rest.join(" "), address_1: o.address, city: o.area ?? "", country: "BD", phone: o.phone, email: "" };
  return {
    id: o.id,
    number: o.order_code,
    status: STATUS_TO_WOO[o.status] ?? "pending",
    currency: "BDT",
    date_created: o.created_at,
    date_modified: o.updated_at,
    total: String(o.total),
    shipping_total: String(o.delivery_fee),
    customer_note: o.note ?? "",
    payment_method: "cod",
    payment_method_title: "Cash on delivery",
    billing: addr,
    shipping: addr,
    line_items: items.map((i) => ({
      id: i.id,
      name: i.product_name,
      product_id: i.product_id,
      quantity: i.quantity,
      price: Number(i.unit_price),
      subtotal: String(i.unit_price * i.quantity),
      total: String(i.unit_price * i.quantity),
    })),
  };
}

function sanitize(v: unknown, max = 20000): string | null {
  if (typeof v !== "string") return null;
  const s = v
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return s || null;
}

function fromWooProduct(b: Row, isCreate: boolean) {
  const out: Row = {};
  const name = sanitize(b.name, 200);
  if (name) {
    out.name = name;
    out.title = name;
  }
  if (isCreate) out.slug = (typeof b.slug === "string" && /^[a-z0-9-]+$/.test(b.slug) ? b.slug : slugify(name ?? "product")) + (b.slug ? "" : "-" + Math.random().toString(36).slice(2, 6));
  if (b.sku !== undefined) out.sku = sanitize(b.sku, 100);
  if (b.description !== undefined) {
    out.description = sanitize(b.description);
    out.specs_description = out.description;
  }
  if (b.short_description !== undefined) out.short_description = sanitize(b.short_description, 500);
  const regular = Number(b.regular_price);
  const sale = Number(b.sale_price);
  if (Number.isFinite(regular) && regular > 0) {
    if (Number.isFinite(sale) && sale > 0 && sale < regular) {
      out.price = sale;
      out.old_price = regular;
    } else {
      out.price = regular;
      out.old_price = null;
    }
  }
  if (b.stock_quantity !== undefined && Number.isInteger(Number(b.stock_quantity))) out.stock = Math.max(0, Number(b.stock_quantity));
  if (b.status) out.status = b.status === "publish" ? "published" : b.status === "draft" || b.status === "pending" ? "draft" : "archived";
  if (b.weight) out.weight_kg = Number(b.weight) || null;
  const img = Array.isArray(b.images) ? b.images.find((i: Row) => typeof i?.src === "string" && /^https?:/i.test(i.src)) : null;
  if (img) {
    out.image_url = img.src;
    out.image_alt = sanitize(img.alt, 200) ?? name;
  }
  if (isCreate) {
    out.price ??= 0;
    out.stock ??= 0;
    out.status ??= "draft";
    out.is_active = true;
  }
  return out;
}

async function setCategory(row: Row, b: Row) {
  const c = Array.isArray(b.categories) ? b.categories[0] : null;
  if (!c) return;
  const { data } = await supabaseAdmin.from("categories").select("id,name").or(`id.eq.${typeof c.id === "string" && /^[0-9a-f-]{36}$/.test(c.id) ? c.id : "00000000-0000-0000-0000-000000000000"},name.ilike.${String(c.name ?? "").replace(/[%,()"]/g, "")}`).limit(1);
  if (data?.[0]) {
    row.category_id = data[0].id;
    row.category = data[0].name;
  }
}

async function productImages(ids: string[]) {
  if (!ids.length) return new Map<string, Row[]>();
  const { data } = await supabaseAdmin.from("product_images").select("product_id,url,alt,sort_order,is_primary").in("product_id", ids);
  const map = new Map<string, Row[]>();
  for (const i of data ?? []) {
    const arr = map.get(i.product_id) ?? [];
    arr.push(i);
    map.set(i.product_id, arr);
  }
  for (const arr of map.values()) arr.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  return map;
}

function paging(url: URL) {
  const per = Math.min(100, Math.max(1, Number(url.searchParams.get("per_page")) || 10));
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  return { per, page, from: (page - 1) * per, to: page * per - 1 };
}

function pageHeaders(total: number, per: number): Record<string, string> {
  return { "X-WP-Total": String(total), "X-WP-TotalPages": String(Math.max(1, Math.ceil(total / per))) };
}

export async function handleWoo(request: Request, path: string): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return options();

  const parts = path.replace(/^\/+|\/+$/g, "").split("/");
  // parts: ["wc","v3",...resource]
  if (parts[0] !== "wc" || !/^v[123]$/.test(parts[1] ?? "")) {
    if (parts.length === 1 && parts[0] === "") return discovery(origin);
    return wooError("rest_no_route", "No route was found matching the URL and request method.", 404);
  }
  const res = parts.slice(2);
  if (res.length === 0) return json({ namespace: "wc/v3", routes: {} });

  if (!authorized(request, url)) return wooError("woocommerce_rest_cannot_view", "Sorry, you cannot list resources.", 401);

  let body: Row = {};
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    try {
      body = (await request.json()) ?? {};
    } catch {
      body = {};
    }
  }

  const [r0, r1, r2] = res;

  try {
    if (r0 === "system_status") {
      return json({
        environment: { home_url: origin, site_url: origin, version: "8.9.0", wp_version: "6.6", language: "en_US" },
        settings: { currency: "BDT", currency_symbol: "৳", api_enabled: true },
        active_plugins: [],
      });
    }

    if (r0 === "settings" || r0 === "webhooks" || r0 === "shipping_methods" || r0 === "payment_gateways" || r0 === "taxes") {
      if (method === "POST") return json({ id: 1, status: "active", ...body }, 201);
      return json(r0 === "payment_gateways" ? [{ id: "cod", title: "Cash on delivery", enabled: true }] : []);
    }

    if (r0 === "products" && r1 === "categories") {
      const { data } = await supabaseAdmin.from("categories").select("id,name,slug,image_url").order("sort_order");
      return json((data ?? []).map((c: Row) => ({ id: c.id, name: c.name, slug: c.slug, parent: 0, image: c.image_url ? { src: c.image_url } : null })));
    }

    if (r0 === "products" && r1 && r2 === "variations") return json([]);

    if (r0 === "products") {
      if (!r1 && method === "GET") {
        const { per, from, to } = paging(url);
        let q = supabaseAdmin.from("products").select("*", { count: "exact" }).order("created_at", { ascending: false });
        const sku = url.searchParams.get("sku");
        const search = url.searchParams.get("search");
        if (sku) q = q.eq("sku", sku);
        if (search) q = q.ilike("name", `%${search.replace(/[%,()"]/g, "")}%`);
        const { data, count, error } = await q.range(from, to);
        if (error) throw error;
        const imgs = await productImages((data ?? []).map((p) => p.id));
        return json((data ?? []).map((p) => toWooProduct(p, origin, imgs.get(p.id))), 200, pageHeaders(count ?? 0, per));
      }
      if (r1 === "batch" && method === "POST") {
        const created = [];
        for (const b of (body.create ?? []).slice(0, 50)) {
          const row = fromWooProduct(b, true);
          await setCategory(row, b);
          const { data } = await supabaseAdmin.from("products").insert(row as any).select("*").single();
          if (data) created.push(toWooProduct(data, origin));
        }
        const updated = [];
        for (const b of (body.update ?? []).slice(0, 50)) {
          const row = fromWooProduct(b, false);
          await setCategory(row, b);
          const { data } = await supabaseAdmin.from("products").update(row as any).eq("id", String(b.id)).select("*").maybeSingle();
          if (data) updated.push(toWooProduct(data, origin));
        }
        return json({ create: created, update: updated, delete: [] });
      }
      if (!r1 && method === "POST") {
        const row = fromWooProduct(body, true);
        if (!row.name) return wooError("woocommerce_rest_invalid_product", "Product name is required.", 400);
        await setCategory(row, body);
        const { data, error } = await supabaseAdmin.from("products").insert(row as any).select("*").single();
        if (error) return wooError("woocommerce_rest_cannot_create", error.message, 400);
        return json(toWooProduct(data, origin), 201);
      }
      if (r1) {
        if (method === "GET") {
          const { data } = await supabaseAdmin.from("products").select("*").eq("id", r1).maybeSingle();
          if (!data) return wooError("woocommerce_rest_product_invalid_id", "Invalid ID.", 404);
          const imgs = await productImages([data.id]);
          return json(toWooProduct(data, origin, imgs.get(data.id)));
        }
        if (method === "PUT" || method === "PATCH" || method === "POST") {
          const row = fromWooProduct(body, false);
          await setCategory(row, body);
          const { data, error } = await supabaseAdmin.from("products").update(row as any).eq("id", r1).select("*").maybeSingle();
          if (error) return wooError("woocommerce_rest_cannot_edit", error.message, 400);
          if (!data) return wooError("woocommerce_rest_product_invalid_id", "Invalid ID.", 404);
          return json(toWooProduct(data, origin));
        }
        if (method === "DELETE") {
          // Archive instead of hard delete to protect order history.
          const { data } = await supabaseAdmin.from("products").update({ status: "archived", is_active: false }).eq("id", r1).select("*").maybeSingle();
          if (!data) return wooError("woocommerce_rest_product_invalid_id", "Invalid ID.", 404);
          return json(toWooProduct(data, origin));
        }
      }
    }

    if (r0 === "orders") {
      if (!r1 && method === "GET") {
        const { per, from, to } = paging(url);
        let q = supabaseAdmin.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
        const st = url.searchParams.get("status");
        if (st && st !== "any" && WOO_TO_STATUS[st]) q = q.eq("status", WOO_TO_STATUS[st] as any);
        const after = url.searchParams.get("after");
        if (after && !Number.isNaN(Date.parse(after))) q = q.gte("created_at", new Date(after).toISOString());
        const { data, count, error } = await q.range(from, to);
        if (error) throw error;
        const ids = (data ?? []).map((o) => o.id);
        const { data: items } = ids.length ? await supabaseAdmin.from("order_items").select("*").in("order_id", ids) : { data: [] };
        return json((data ?? []).map((o) => toWooOrder(o, (items ?? []).filter((i) => i.order_id === o.id))), 200, pageHeaders(count ?? 0, per));
      }
      if (r1) {
        if (method === "PUT" || method === "PATCH" || method === "POST") {
          const st = WOO_TO_STATUS[String(body.status ?? "")];
          if (st) await supabaseAdmin.from("orders").update({ status: st as any }).eq("id", r1);
        } else if (method !== "GET") {
          return wooError("rest_no_route", "Not supported.", 405);
        }
        const { data } = await supabaseAdmin.from("orders").select("*").eq("id", r1).maybeSingle();
        if (!data) return wooError("woocommerce_rest_shop_order_invalid_id", "Invalid ID.", 404);
        const { data: items } = await supabaseAdmin.from("order_items").select("*").eq("order_id", r1);
        return json(toWooOrder(data, items ?? []));
      }
    }

    return wooError("rest_no_route", "No route was found matching the URL and request method.", 404);
  } catch (e) {
    console.error("[woo]", e);
    return wooError("internal_error", "Something went wrong.", 500);
  }
}

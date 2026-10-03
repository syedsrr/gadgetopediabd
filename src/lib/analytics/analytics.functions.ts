import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeAnalytics, resolvePeriod } from "./metrics";

const input = z.object({
  period: z.enum(["today", "7d", "30d", "mtd", "custom"]),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** Admin-only. Reads with the caller's own RLS scope; returns aggregates only (no names/phones). */
export const getMarketingAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: isAdmin } = await sb.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!isAdmin) throw new Error("Forbidden");

    const period = resolvePeriod(data.period, new Date(), data.start && data.end ? { start: data.start, end: data.end } : undefined);

    const { data: orders, error: oe } = await sb
      .from("orders")
      .select("id, status, subtotal, user_id, phone, created_at")
      .gte("created_at", period.previous.start)
      .lt("created_at", period.current.end)
      .limit(10000);
    if (oe) throw new Error("Could not load orders");

    const ids = (orders ?? []).map((o) => o.id);
    const items: { order_id: string; product_id: string | null; product_name: string; unit_price: number; quantity: number }[] = [];
    for (let i = 0; i < ids.length; i += 200) {
      const { data: rows, error } = await sb
        .from("order_items")
        .select("order_id, product_id, product_name, unit_price, quantity")
        .in("order_id", ids.slice(i, i + 200));
      if (error) throw new Error("Could not load order items");
      items.push(...(rows ?? []));
    }

    const [{ data: products, error: pe }, { data: categories, error: ce }] = await Promise.all([
      sb.from("products").select("id, name, category_id, price, stock, is_active"),
      sb.from("categories").select("id, name"),
    ]);
    if (pe || ce) throw new Error("Could not load catalogue");

    return computeAnalytics({ orders: orders ?? [], items, products: products ?? [], categories: categories ?? [], period });
  });

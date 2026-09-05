import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { priceInfo } from "@/lib/format";

const phoneRegex = /^[0-9+\-\s]{11,15}$/;

const placeOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(phoneRegex),
  location: z.enum(["inside_dhaka", "outside_dhaka"]),
  address: z.string().trim().min(8).max(400),
  note: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});

export const SHIPPING_FEES = {
  inside_dhaka: 60,
  outside_dhaka: 120,
} as const;

export type ShippingLocation = keyof typeof SHIPPING_FEES;

export const LOCATION_LABEL: Record<ShippingLocation, string> = {
  inside_dhaka: "Inside Dhaka",
  outside_dhaka: "Outside Dhaka",
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = [...new Set(data.items.map((i) => i.product_id))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, price, sale_price, old_price, sale_starts_at, sale_ends_at, stock, allow_backorder, is_active, status",
      )
      .in("id", ids);
    if (productError) throw new Error("Could not verify products");

    const lines = data.items.map((item) => {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product || !product.is_active || product.status !== "published") {
        throw new Error("A product is no longer available");
      }
      if (product.stock < item.quantity && !product.allow_backorder) {
        throw new Error(`Not enough stock for ${product.name}`);
      }
      return {
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        // Price is resolved server-side so a tampered cart cannot change it.
        unit_price: priceInfo(product).selling,
        remaining: product.stock - item.quantity,
      };
    });

    const deliveryFee = SHIPPING_FEES[data.location];
    const subtotal = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    const total = subtotal + deliveryFee;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        area: LOCATION_LABEL[data.location],
        address: data.address,
        note: data.note ?? null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
      })
      .select("id, order_code, total")
      .single();
    if (orderError || !order) throw new Error("Could not create the order");

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product_id,
        product_name: l.product_name,
        quantity: l.quantity,
        unit_price: l.unit_price,
      })),
    );
    if (itemsError) throw new Error("Could not save the order items");

    // Decrement inventory for each ordered product.
    for (const l of lines) {
      const { error: stockError } = await supabaseAdmin
        .from("products")
        .update({ stock: Math.max(0, l.remaining) })
        .eq("id", l.product_id);
      if (stockError) console.error("stock update failed", l.product_id, stockError);
    }

    return { id: order.id, order_code: order.order_code, total: Number(order.total) };
  });

export const getOrderById = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_code, customer_name, area, address, phone, subtotal, delivery_fee, total, status, created_at, order_items(product_name, quantity, unit_price)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Could not load the order");
    return order ?? null;
  });

export const trackOrders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ query: z.string().trim().min(4).max(60) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.query;
    const isPhone = phoneRegex.test(q);

    const builder = supabaseAdmin
      .from("orders")
      .select("id, order_code, status, total, area, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: orders, error } = isPhone
      ? await builder.eq("phone", q)
      : await builder.eq("order_code", q.toUpperCase());

    if (error) throw new Error("Could not look up orders");
    return orders ?? [];
  });

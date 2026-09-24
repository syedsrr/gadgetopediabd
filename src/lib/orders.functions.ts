import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isPreorder, priceInfo } from "@/lib/format";

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

    // Optional buyer identity: derived from the request bearer token only, never from input.
    let buyerId: string | null = null;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const header = getRequest()?.headers.get("authorization") ?? "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";
      if (token.split(".").length === 3) {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        buyerId = userData?.user?.id ?? null;
      }
    } catch {
      buyerId = null;
    }


    const ids = [...new Set(data.items.map((i) => i.product_id))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, price, sale_price, old_price, sale_starts_at, sale_ends_at, stock, allow_backorder, is_preorder, is_active, status",
      )
      .in("id", ids);
    if (productError) throw new Error("Could not verify products");

    const lines = data.items.map((item) => {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product || !product.is_active || product.status !== "published") {
        throw new Error("A product is no longer available");
      }
      if (product.stock < item.quantity && !product.allow_backorder && !isPreorder(product)) {
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
        user_id: buyerId,

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
        "id, order_code, area, subtotal, delivery_fee, total, status, created_at, order_items(product_name, quantity, unit_price)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Could not load the order");
    return order ?? null;
  });

export const trackOrders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        orderCode: z.string().trim().min(4).max(20),
        phone: z.string().trim().regex(phoneRegex),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = (v: string) => v.replace(/[^0-9]/g, "").slice(-10);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_code, status, total, area, created_at, phone")
      .eq("order_code", data.orderCode.toUpperCase())
      .maybeSingle();

    if (error) throw new Error("Could not look up orders");
    // Both the order code and the phone used at checkout must match.
    if (!order || digits(order.phone) !== digits(data.phone)) return [];
    const { phone: _phone, ...safe } = order;
    return [safe];
  });

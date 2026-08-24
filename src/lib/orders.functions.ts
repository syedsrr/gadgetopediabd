import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const placeOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{11,15}$/),
  area: z.string().trim().max(80).optional(),
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

export const DELIVERY_FEE_SERVER = 70;

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = [...new Set(data.items.map((i) => i.product_id))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock, is_active")
      .in("id", ids);
    if (productError) throw new Error("Could not verify products");

    const lines = data.items.map((item) => {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product || !product.is_active) throw new Error("A product is no longer available");
      if (product.stock < item.quantity) throw new Error(`Not enough stock for ${product.name}`);
      return {
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: Number(product.price),
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    const total = subtotal + DELIVERY_FEE_SERVER;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        area: data.area ?? null,
        address: data.address,
        note: data.note ?? null,
        subtotal,
        delivery_fee: DELIVERY_FEE_SERVER,
        total,
      })
      .select("id, order_code, total")
      .single();
    if (orderError || !order) throw new Error("Could not create the order");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) throw new Error("Could not save the order items");

    return { order_code: order.order_code, total: Number(order.total) };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const phoneRegex = /^[0-9+\-\s]{11,15}$/;

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().max(40).optional(),
  recipient_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(phoneRegex),
  address: z.string().trim().min(8).max(400),
  area: z.string().trim().max(60).optional(),
  is_default: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

/** Orders belonging to the signed-in buyer (RLS also matches legacy orders by phone). */
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, order_code, status, subtotal, delivery_fee, total, area, address, phone, created_at, order_items(product_name, quantity, unit_price)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Could not load your orders");
    return data ?? [];
  });

export const getMyAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customer_addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error("Could not load your addresses");
    return data ?? [];
  });

export const saveMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => addressSchema.parse(data))
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      label: data.label?.length ? data.label : null,
      recipient_name: data.recipient_name,
      phone: data.phone,
      address: data.address,
      area: data.area?.length ? data.area : null,
      is_default: data.is_default ?? false,
    };

    if (row.is_default) {
      await context.supabase
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("user_id", context.userId);
    }

    if (data.id) {
      const { error } = await context.supabase
        .from("customer_addresses")
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error("Could not update the address");
      return { id: data.id };
    }

    const { data: inserted, error } = await context.supabase
      .from("customer_addresses")
      .insert(row)
      .select("id")
      .single();
    if (error || !inserted) throw new Error("Could not save the address");
    return { id: inserted.id };
  });

export const deleteMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("customer_addresses")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error("Could not remove the address");
    return { ok: true };
  });

export const setDefaultAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("user_id", context.userId);
    const { error } = await context.supabase
      .from("customer_addresses")
      .update({ is_default: true })
      .eq("id", data.id);
    if (error) throw new Error("Could not set the default address");
    return { ok: true };
  });

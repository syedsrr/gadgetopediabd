import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["admin", "staff", "customer"]);

export type ManagedRole = z.infer<typeof roleSchema>;

export type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
  roles: ManagedRole[];
};

/** Throws unless the caller holds the admin role (checked with the caller's own RLS scope). */
async function assertAdmin(supabase: {
  from: (t: "user_roles") => {
    select: (c: string) => {
      eq: (
        c: string,
        v: string,
      ) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> } };
    };
  };
}, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, phone, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin.from("user_roles").select("user_id, role"),
      ]);

    if (profileError || roleError) throw new Error("Could not load the people list");

    const byUser = new Map<string, ManagedRole[]>();
    for (const row of roles ?? []) {
      const list = byUser.get(row.user_id) ?? [];
      list.push(row.role as ManagedRole);
      byUser.set(row.user_id, list);
    }

    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email ?? null,
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      created_at: p.created_at ?? null,
      roles: byUser.get(p.id) ?? [],
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: roleSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);

    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("You cannot remove your own admin access");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw new Error("Could not update this person's role");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error("Could not update this person's role");

    return { ok: true as const };
  });

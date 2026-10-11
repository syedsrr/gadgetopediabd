import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const tokenSchema = z.string().min(40).max(200).regex(/^[A-Za-z0-9_-]+$/);

export const assignContestPrize = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = randomBytes(32).toString("base64url");
    const { data, error } = await supabaseAdmin.rpc("contest_assign_prize", {
      p_token_hash: tokenHash(token),
    });
    if (error) {
      console.error("[contest] prize assignment failed", error.message);
      throw new Error("The contest is temporarily unavailable. Please try again later.");
    }
    if (!data?.available) return { available: false as const };
    return {
      available: true as const,
      entryId: String(data.entry_id),
      prizeName: String(data.prize_name),
      claimDeadline: String(data.claim_deadline),
      claimToken: token,
    };
  });

const claimSchema = z.object({
  entryId: z.string().uuid(),
  claimToken: tokenSchema,
  fullName: z.string().trim().min(2).max(100),
  kdBatchNumber: z.string().trim().min(1).max(50),
  phoneNumber: z.string().trim().min(7).max(25).regex(/^[0-9+()\-\s]+$/),
  review: z.string().trim().max(2000).optional().default(""),
});

export const submitContestClaim = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => claimSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("contest_submit_claim", {
      p_entry_id: data.entryId,
      p_token_hash: tokenHash(data.claimToken),
      p_full_name: data.fullName,
      p_kd_batch_number: data.kdBatchNumber,
      p_phone_number: data.phoneNumber,
      p_review: data.review || null,
    });
    if (error) {
      console.error("[contest] claim submission failed", error.message);
      throw new Error("We couldn't submit your claim. Please try again.");
    }
    if (!result?.ok) {
      const reason = String(result?.reason ?? "invalid");
      if (reason === "expired") throw new Error("Your 24-hour claim period has expired.");
      if (reason === "completed" || reason === "already_submitted") throw new Error("This claim has already been submitted.");
      throw new Error("This claim link is invalid. Please scan the contest QR code again.");
    }
    return { ok: true as const };
  });

const adminSchema = z.object({ accessToken: z.string().min(20).max(4096) });

export const getContestAdminData = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (authError || !authData.user) throw new Error("Sign in with an authorized contest admin account.");
    const { data: allowed, error: allowError } = await supabaseAdmin
      .from("contest_admins")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (allowError || !allowed) throw new Error("This account is not authorized to view contest claims.");

    const { data: entries, error } = await supabaseAdmin
      .from("contest_entries")
      .select("id, prize_id, status, assigned_at, claim_deadline, completed_at, expired_at, contest_prizes(prize_name), contest_claims(full_name, kd_batch_number, phone_number, review, submitted_at)")
      .order("assigned_at", { ascending: false })
      .limit(500);
    if (error) throw new Error("Could not load contest records.");
    return { entries: entries ?? [] };
  });

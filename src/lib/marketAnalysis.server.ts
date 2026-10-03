// Server-only: builds and stores an AI market analysis report.
const MODEL = "google/gemini-3.8-flash";

export async function generateMarketReport(source: "manual" | "weekly") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("name, brand, category, price, sale_price, stock, is_preorder")
    .eq("is_active", true)
    .eq("status", "published")
    .order("sort_priority", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);

  const lines = (products ?? [])
    .map((p) => `${p.name} | ${p.brand ?? "-"} | ${p.category ?? "-"} | ৳${p.sale_price ?? p.price} | stock ${p.stock}${p.is_preorder ? " | pre-order" : ""}`)
    .join("\n");

  const prompt = `You are a retail market analyst for Gadgetopedia, an online gadget & lifestyle store in Bangladesh (prices in BDT ৳, cash on delivery). Here is our catalogue:\n${lines}\n\nWrite a concise weekly market report (max ~600 words, markdown) with sections:\n1. Market snapshot (Bangladesh gadget market trends relevant to these products)\n2. Price positioning: for key products, typical BD market price range (Daraz, Star Tech, Pickaboo, etc.) vs ours — flag overpriced/underpriced\n3. Opportunities: trending similar products we should stock\n4. Action items (5 bullets).\nState that price ranges are estimates.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": process.env["LOVABLE_API_KEY"] ?? "",
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"] ?? ""}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({ model: MODEL, stream: true, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => "");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Plans & credits.");
    if (res.status === 429) throw new Error("AI is busy right now, please try again in a minute.");
    throw new Error(`AI request failed (${res.status}) ${msg.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let report = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const line of parts) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        report += JSON.parse(payload).choices?.[0]?.delta?.content ?? "";
      } catch {
        /* ignore partial */
      }
    }
  }
  if (!report.trim()) throw new Error("The AI returned an empty report.");

  const { data: row, error: insErr } = await supabaseAdmin
    .from("market_reports")
    .insert({ source, product_count: products?.length ?? 0, report })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);
  return row.id;
}

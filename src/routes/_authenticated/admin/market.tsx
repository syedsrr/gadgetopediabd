import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { runMarketAnalysis } from "@/lib/marketAnalysis.functions";

export const Route = createFileRoute("/_authenticated/admin/market")({
  head: () => ({ meta: [{ title: "AI market analysis — Admin" }] }),
  component: MarketPage,
});

function MarketPage() {
  const qc = useQueryClient();
  const run = useServerFn(runMarketAnalysis);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["market_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_reports")
        .select("id, created_at, source, product_count, report")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  async function generate() {
    setBusy(true);
    try {
      const { id } = await run();
      await qc.invalidateQueries({ queryKey: ["market_reports"] });
      setOpenId(id);
      toast.success("New market report ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const current = reports.find((r) => r.id === openId) ?? reports[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">AI market analysis</h1>
          <p className="text-sm text-muted-foreground">Gemini compares your products with the Bangladesh market. A new report is created automatically every 7 days.</p>
        </div>
        <Button onClick={generate} disabled={busy}>
          <Sparkles className="mr-1.5 h-4 w-4" /> {busy ? "Analysing… (up to a minute)" : "Run analysis now"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      ) : !current ? (
        <p className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">No reports yet. Click "Run analysis now" to create the first one.</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <ul className="space-y-1">
            {reports.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setOpenId(r.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${r.id === current.id ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}
                >
                  {new Date(r.created_at).toLocaleDateString()} · {r.source === "weekly" ? "Weekly" : "Manual"}
                </button>
              </li>
            ))}
          </ul>
          <article className="whitespace-pre-wrap rounded-xl border border-border bg-background p-5 text-sm leading-relaxed">
            <p className="mb-3 text-xs text-muted-foreground">{current.product_count} products analysed · {new Date(current.created_at).toLocaleString()}</p>
            {current.report}
          </article>
        </div>
      )}
    </div>
  );
}

import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PackageSearch, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBDT } from "@/lib/format";
import { trackOrders } from "@/lib/orders.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track-order")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search['q'] === "string" && search['q'] ? { q: search['q'] } : {},
  head: () => ({
    meta: [
      { title: "Track your order — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "Check your gadgetOpedia n' Lifestyle delivery status. Enter your phone number or order code to see live order progress.",
      },
      { property: "og:title", content: "Track your order — gadgetOpedia n' Lifestyle" },
      {
        property: "og:description",
        content: "Enter your phone number or order code to see live delivery status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackOrder,
});

const STAGES = ["pending", "confirmed", "shipped", "delivered"] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <span className="inline-flex rounded-full bg-sale px-3 py-1 text-xs font-bold text-sale-foreground">
        Cancelled
      </span>
    );
  }
  const activeIndex = STAGES.indexOf(status as (typeof STAGES)[number]);
  return (
    <div className="flex flex-wrap gap-2">
      {STAGES.map((s, i) => (
        <span
          key={s}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            i <= activeIndex
              ? "bg-canopy text-canopy-foreground"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  );
}

function TrackOrder() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const lookup = useServerFn(trackOrders);
  const mutation = useMutation({
    mutationFn: (value: string) => lookup({ data: { query: value } }),
  });

  useEffect(() => {
    if (q && q.length >= 4) mutation.mutate(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = query.trim();
    if (value.length < 4) return;
    mutation.mutate(value);
  }

  const results = mutation.data;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <span className="eyebrow text-moss">Order tracking</span>
        <h1 className="mt-1 font-display text-3xl font-bold">Where is my parcel?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the phone number you ordered with, or your order code (e.g. GO-A1B2C3).
        </p>

        <form
          onSubmit={submit}
          className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft"
        >
          <Label htmlFor="track-query">Phone number or order code</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="track-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="01XXXXXXXXX or GO-A1B2C3"
              className="sm:flex-1"
            />
            <Button type="submit" disabled={mutation.isPending || query.trim().length < 4}>
              <Search className="mr-1.5 h-4 w-4" />
              {mutation.isPending ? "Searching…" : "Track order"}
            </Button>
          </div>
        </form>

        {mutation.isError && (
          <p className="mt-6 text-sm text-sale">
            Something went wrong looking that up. Please try again.
          </p>
        )}

        {results && results.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No orders found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Double-check the phone number or order code you used at checkout.
            </p>
            <Button variant="outline" className="mt-5" asChild>
              <Link to="/shop">Browse the shop</Link>
            </Button>
          </div>
        )}

        {results && results.length > 0 && (
          <ul className="mt-8 space-y-4">
            {results.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-lg font-bold text-primary">{o.order_code}</p>
                  <p className="text-sm font-semibold">{formatBDT(o.total)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Placed {new Date(o.created_at).toLocaleDateString("en-GB")}
                  {o.area ? ` · ${o.area}` : ""}
                </p>
                <div className="mt-4">
                  <StatusTimeline status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}

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
          "Check your gadgetOpedia n' Lifestyle delivery status. Enter your order code and phone number to see live order progress.",
      },
      { property: "og:title", content: "Track your order — gadgetOpedia n' Lifestyle" },
      {
        property: "og:description",
        content: "Enter your order code and phone number to see live delivery status.",
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
  const [phone, setPhone] = useState("");
  const lookup = useServerFn(trackOrders);
  const mutation = useMutation({
    mutationFn: (v: { orderCode: string; phone: string }) => lookup({ data: v }),
  });

  useEffect(() => {
    if (q) setQuery(q);
  }, [q]);

  const canSubmit = query.trim().length >= 4 && /^[0-9+\-\s]{11,15}$/.test(phone.trim());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({ orderCode: query.trim(), phone: phone.trim() });
  }

  const results = mutation.data;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <span className="eyebrow text-moss">Order tracking</span>
        <h1 className="mt-1 font-display text-3xl font-bold">Where is my parcel?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your order code (e.g. GO-A1B2C3) and the phone number you ordered with.
        </p>

        <form
          onSubmit={submit}
          className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="track-query">Order code</Label>
              <Input
                id="track-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="GO-A1B2C3"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="track-phone">Phone number</Label>
              <Input
                id="track-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="mt-2"
              />
            </div>
          </div>
          <div className="mt-3 flex">
            <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending || !canSubmit}>
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
              Double-check the order code and phone number you used at checkout.
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

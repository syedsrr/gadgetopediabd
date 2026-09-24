import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/format";
import { getOrderById } from "@/lib/orders.functions";

export const Route = createFileRoute("/order-success/$id")({
  head: () => ({
    meta: [
      { title: "Order confirmed — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "Your gadgetOpedia n' Lifestyle order is confirmed. Review your order code, items and cash-on-delivery total.",
      },
      { property: "og:title", content: "Order confirmed — gadgetOpedia n' Lifestyle" },
      { property: "og:description", content: "Your order has been placed successfully." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { id } = Route.useParams();
  const { data, isPending, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => {
      let orderCode: string | undefined;
      try {
        orderCode = sessionStorage.getItem(`order-code:${id}`) ?? undefined;
      } catch {
        orderCode = undefined;
      }
      return getOrderById({ data: { id, orderCode } });
    },
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-5 py-16">
        {isPending ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading your order…</p>
          </div>
        ) : error || !data ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <h1 className="font-display text-2xl font-bold">Order not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t find this order. Try the tracking page with your phone number.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/track-order">Track an order</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-moss" />
              <h1 className="mt-5 font-display text-3xl font-bold">Order confirmed</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Thank you! We&apos;ll call you shortly to confirm delivery.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="eyebrow text-muted-foreground">Order code</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">
                    {data.order_code}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize text-foreground">
                  {data.status}
                </span>
              </div>

              <Separator className="my-5" />

              <ul className="space-y-2 text-sm">
                {(data.order_items ?? []).map((item, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 flex-1 text-muted-foreground">
                      {item.product_name} <span className="text-foreground">× {item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      {formatBDT(Number(item.unit_price) * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <Separator className="my-5" />

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatBDT(data.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping ({data.area ?? "Delivery"})</dt>
                  <dd>{formatBDT(data.delivery_fee)}</dd>
                </div>
                <div className="flex justify-between font-display text-base font-bold">
                  <dt>Payable on delivery</dt>
                  <dd className="text-primary">{formatBDT(data.total)}</dd>
                </div>
              </dl>

              <Separator className="my-5" />

              <p className="text-sm text-muted-foreground">
                Save your order code — you&apos;ll need it with your phone number to track delivery.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/shop">Continue shopping</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/track-order" search={{ q: data.order_code }}>
                  Track this order
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}

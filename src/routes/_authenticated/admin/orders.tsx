import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatBDT } from "@/lib/format";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function OrdersAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");

  const { data: orders = [], isPending } = useQuery({
    queryKey: ["admin-orders", search, status],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select(
          "id, order_code, customer_name, phone, address, area, note, subtotal, delivery_fee, total, status, created_at, order_items(id, product_name, unit_price, quantity)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (status !== "all") q = q.eq("status", status);
      const term = search.trim();
      if (term) q = q.or(`order_code.ilike.%${term}%,phone.ilike.%${term}%,customer_name.ilike.%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const setOrderStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">Latest 100 orders, newest first.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order code, phone or customer"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as "all" | OrderStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No orders found.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Card>
                <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold">{o.order_code}</span>
                      <Badge variant="secondary">{o.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm">
                      {o.customer_name} · {o.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {o.address}
                      {o.area ? `, ${o.area}` : ""}
                    </p>
                    {o.note && <p className="mt-1 text-xs italic text-muted-foreground">“{o.note}”</p>}
                    <ul className="mt-3 space-y-1 text-sm">
                      {o.order_items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span className="truncate">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatBDT(Number(item.unit_price) * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatBDT(o.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span>{formatBDT(o.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatBDT(o.total)}</span>
                    </div>
                    <Select
                      value={o.status}
                      onValueChange={(v) =>
                        setOrderStatus.mutate({ id: o.id, next: v as OrderStatus })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

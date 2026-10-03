// @ts-expect-error bun:test types are not installed; run with `bun test`
import { describe, expect, test } from "bun:test";

import { computeAnalytics, growth, resolvePeriod } from "./metrics";

const period = resolvePeriod("7d", new Date("2026-10-03T12:00:00Z"));

describe("analytics", () => {
  test("7-day period and equal previous period", () => {
    expect(period.current).toEqual({ start: "2026-09-27T00:00:00.000Z", end: "2026-10-04T00:00:00.000Z" });
    expect(period.previous.start).toBe("2026-09-20T00:00:00.000Z");
  });

  test("empty data is safe", () => {
    const r = computeAnalytics({ orders: [], items: [], products: [], categories: [], period });
    expect(r.current).toEqual({ revenue: 0, orders: 0, units: 0, aov: null });
    expect(r.growth.revenue).toBeNull();
    expect(r.inventory.stockValueAtCost.value).toBeNull();
  });

  test("cancelled orders excluded; money exact; repeat customers", () => {
    const o = (id: string, status: string, subtotal: string, phone: string, at: string) => ({ id, status, subtotal, user_id: null, phone, created_at: at });
    const r = computeAnalytics({
      orders: [
        o("a", "pending", "0.10", "017-1", "2026-10-01T00:00:00Z"),
        o("b", "delivered", "0.20", "0171", "2026-10-02T00:00:00Z"),
        o("c", "cancelled", "999", "0172", "2026-10-02T00:00:00Z"),
        o("d", "delivered", "0.15", "0173", "2026-09-21T00:00:00Z"),
      ],
      items: [
        { order_id: "a", product_id: "p1", product_name: "X", unit_price: "0.10", quantity: 1 },
        { order_id: "b", product_id: "p1", product_name: "X", unit_price: "0.10", quantity: 2 },
        { order_id: "c", product_id: "p1", product_name: "X", unit_price: "999", quantity: 5 },
      ],
      products: [{ id: "p1", name: "X", category_id: "c1", price: "10", stock: 3, is_active: true }],
      categories: [{ id: "c1", name: "Cables" }],
      period,
    });
    expect(r.current).toEqual({ revenue: 0.3, orders: 2, units: 3, aov: 0.15 });
    expect(r.growth.revenue).toBe(100);
    expect(r.customers).toEqual({ unique: 1, repeat: 1 });
    expect(r.categories[0]).toEqual({ key: "c1", name: "Cables", units: 3, revenue: 0.3 });
    expect(r.inventory.stockValueAtRetail).toBe(30);
  });

  test("growth from zero is undefined", () => expect(growth(5, 0)).toBeNull());
});

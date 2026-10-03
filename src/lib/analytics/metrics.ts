// Deterministic marketing metrics. Pure functions — no I/O — so they can be tested and reused by later AI phases.
// Money is summed in integer paisa (×100) to avoid floating-point drift, then returned as numbers with 2 decimals.

export type PeriodKey = "today" | "7d" | "30d" | "mtd" | "custom";
export type Range = { start: string; end: string }; // ISO, start inclusive, end exclusive

export type OrderRow = { id: string; status: string; subtotal: number | string; user_id: string | null; phone: string; created_at: string };
export type ItemRow = { order_id: string; product_id: string | null; product_name: string; unit_price: number | string; quantity: number };
export type ProductRow = { id: string; name: string; category_id: string | null; price: number | string; stock: number; is_active: boolean };
export type CategoryRow = { id: string; name: string };

export type Unavailable = { value: null; reason: string };

/** Statuses that never count as sales (existing order_status enum). */
export const EXCLUDED_STATUSES = ["cancelled"] as const;

const DAY = 86_400_000;
const toCents = (v: number | string) => Math.round(Number(v) * 100);
const fromCents = (c: number) => c / 100;

export function resolvePeriod(key: PeriodKey, now = new Date(), custom?: { start: string; end: string }) {
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let start: number;
  let end = startOfToday + DAY;
  if (key === "today") start = startOfToday;
  else if (key === "7d") start = end - 7 * DAY;
  else if (key === "30d") start = end - 30 * DAY;
  else if (key === "mtd") start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  else {
    if (!custom) throw new Error("Custom period needs start and end dates");
    start = Date.parse(custom.start.slice(0, 10) + "T00:00:00Z");
    end = Date.parse(custom.end.slice(0, 10) + "T00:00:00Z") + DAY; // end date inclusive
    if (!(end > start)) throw new Error("End date must be on or after start date");
  }
  const len = end - start;
  const iso = (t: number) => new Date(t).toISOString();
  return { current: { start: iso(start), end: iso(end) }, previous: { start: iso(start - len), end: iso(start) } };
}

/** Percentage change; null when the previous value is 0 (growth undefined). */
export function growth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

const countable = (o: OrderRow) => !(EXCLUDED_STATUSES as readonly string[]).includes(o.status);
const inRange = (o: OrderRow, r: Range) => o.created_at >= r.start && o.created_at < r.end;
const customerKey = (o: OrderRow) => o.user_id ?? "p:" + o.phone.replace(/\D/g, "");

export function summarize(orders: OrderRow[], items: ItemRow[], range: Range) {
  const valid = orders.filter((o) => countable(o) && inRange(o, range));
  const ids = new Set(valid.map((o) => o.id));
  const revenueC = valid.reduce((s, o) => s + toCents(o.subtotal), 0);
  const units = items.filter((i) => ids.has(i.order_id)).reduce((s, i) => s + i.quantity, 0);
  return {
    revenue: fromCents(revenueC),
    orders: valid.length,
    units,
    aov: valid.length ? fromCents(Math.round(revenueC / valid.length)) : null,
  };
}

export function computeAnalytics(input: {
  orders: OrderRow[]; // must cover previous.start .. current.end
  items: ItemRow[];
  products: ProductRow[];
  categories: CategoryRow[];
  period: { current: Range; previous: Range };
}) {
  const { orders, items, products, categories, period } = input;
  const cur = summarize(orders, items, period.current);
  const prev = summarize(orders, items, period.previous);

  const curOrders = orders.filter((o) => countable(o) && inRange(o, period.current));
  const curIds = new Set(curOrders.map((o) => o.id));
  const curItems = items.filter((i) => curIds.has(i.order_id));

  const productById = new Map(products.map((p) => [p.id, p]));
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const byProduct = new Map<string, { key: string; name: string; revenueC: number; units: number }>();
  const byCategory = new Map<string, { key: string; name: string; revenueC: number; units: number }>();
  for (const i of curItems) {
    const lineC = toCents(i.unit_price) * i.quantity;
    const pk = i.product_id ?? "deleted:" + i.product_name;
    const p = byProduct.get(pk) ?? { key: pk, name: i.product_name, revenueC: 0, units: 0 };
    p.revenueC += lineC; p.units += i.quantity; byProduct.set(pk, p);
    const catId = i.product_id ? productById.get(i.product_id)?.category_id ?? null : null;
    const ck = catId ?? "uncategorised";
    const c = byCategory.get(ck) ?? { key: ck, name: catId ? catName.get(catId) ?? "Unknown" : "Uncategorised", revenueC: 0, units: 0 };
    c.revenueC += lineC; c.units += i.quantity; byCategory.set(ck, c);
  }
  const rank = (m: typeof byProduct) =>
    [...m.values()].sort((a, b) => b.revenueC - a.revenueC).map(({ revenueC, ...r }) => ({ ...r, revenue: fromCents(revenueC) }));

  const perCustomer = new Map<string, number>();
  for (const o of curOrders) perCustomer.set(customerKey(o), (perCustomer.get(customerKey(o)) ?? 0) + 1);

  const active = products.filter((p) => p.is_active);
  const stockUnits = active.reduce((s, p) => s + Math.max(0, p.stock), 0);
  const retailC = active.reduce((s, p) => s + toCents(p.price) * Math.max(0, p.stock), 0);

  const stockValueAtCost: Unavailable = { value: null, reason: "Products have no cost price field, so stock value at cost cannot be calculated." };

  return {
    period,
    current: cur,
    previous: prev,
    growth: {
      revenue: growth(cur.revenue, prev.revenue),
      orders: growth(cur.orders, prev.orders),
      units: growth(cur.units, prev.units),
    },
    products: rank(byProduct),
    categories: rank(byCategory),
    customers: {
      unique: perCustomer.size,
      repeat: [...perCustomer.values()].filter((n) => n > 1).length, // >1 order within the current period
    },
    inventory: { activeProducts: active.length, stockUnits, stockValueAtRetail: fromCents(retailC), stockValueAtCost },
  };
}

export type AnalyticsResult = ReturnType<typeof computeAnalytics>;

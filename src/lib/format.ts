export function formatBDT(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function discountPercent(
  price: number | string,
  oldPrice: number | string | null | undefined,
): number | null {
  const p = Number(price);
  const o = Number(oldPrice ?? 0);
  if (!o || o <= p) return null;
  return Math.round(((o - p) / o) * 100);
}

type PricedProduct = {
  price: number | string;
  sale_price?: number | string | null;
  old_price?: number | string | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
};

export type PriceInfo = {
  /** What the customer pays right now. */
  selling: number;
  /** Struck-through reference price, when there is a discount. */
  compareAt: number | null;
  off: number | null;
  onSale: boolean;
};

/** Resolves the live selling price, honouring the optional sale window. */
export function priceInfo(product: PricedProduct): PriceInfo {
  const regular = Number(product.price ?? 0);
  const sale = product.sale_price == null ? null : Number(product.sale_price);
  const now = Date.now();
  const startsOk = !product.sale_starts_at || new Date(product.sale_starts_at).getTime() <= now;
  const endsOk = !product.sale_ends_at || new Date(product.sale_ends_at).getTime() >= now;
  const onSale = sale !== null && sale > 0 && sale < regular && startsOk && endsOk;

  const selling = onSale ? sale! : regular;
  const legacyOld = product.old_price == null ? null : Number(product.old_price);
  const compareAt = onSale ? regular : legacyOld && legacyOld > selling ? legacyOld : null;

  return {
    selling,
    compareAt,
    off: compareAt ? Math.round(((compareAt - selling) / compareAt) * 100) : null,
    onSale,
  };
}

type StockedProduct = { stock: number | null; allow_backorder?: boolean | null };

export function isPurchasable(product: StockedProduct): boolean {
  return Number(product.stock ?? 0) > 0 || Boolean(product.allow_backorder);
}

type PreorderProduct = StockedProduct & { is_preorder?: boolean | null };

/** Manual pre-order flag, or a zero-stock item you allow to be ordered anyway. */
export function isPreorder(product: PreorderProduct): boolean {
  if (product.is_preorder) return true;
  return Number(product.stock ?? 0) <= 0 && Boolean(product.allow_backorder);
}

/** Nothing left, no backorder, not a pre-order — customers cannot buy it. */
export function isSoldOut(product: PreorderProduct): boolean {
  return !isPurchasable(product) && !isPreorder(product);
}

/** "20 Sep 2026" — friendly arrival date, or null when there is none. */
export function formatReleaseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

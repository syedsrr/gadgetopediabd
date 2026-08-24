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

# Sold-out section, pre-orders first, and admin catch-up

## What you'll see

1. **Pre-order moves to the top.** On the home page the "Pre-order now" row moves above Featured picks, right under the category strip, so upcoming items are the first products people see.
2. **New "Sold out" section.** A section near the bottom of the home page showing items that are currently unavailable (no stock and no backorder allowed), each greyed with a "Sold out" tag and a "Notify-free" link to its product page. Hidden automatically when nothing is sold out.
3. **New /sold-out page.** A full listing of sold-out items with search, loading placeholders, an empty state, and its own page title/description. Linked from the top menu and included in the sitemap.
4. **Shop page filter.** A small toggle on /shop to show only in-stock items, so sold-out products no longer clutter browsing (they stay visible by default, with the sold-out tag).
5. **Admin updates**
   - Dashboard: new count tiles for Sold out, Pre-order, and Low stock, each linking to a filtered product list.
   - Product list: status filter (All / In stock / Low stock / Sold out / Pre-order / Draft), a stock column with inline quick restock, and Pre-order / Sold out badges.
   - Product form: pre-order fields grouped with clearer help text, and a warning banner when an item is saved with zero stock and backorders off (it will show as sold out).
   - Import page: the template and column help list the pre-order fields already supported, so imports stay in sync.

## Technical notes

- Add `isSoldOut(product)` to `src/lib/format.ts`: `stock <= 0 && !allow_backorder && !is_preorder`. Reuse the existing `isPreorder`/`isPurchasable` helpers everywhere so definitions stay in one place.
- `src/routes/index.tsx`: reorder sections (pre-order above featured); derive sold-out list from the already-loaded catalog query — no extra fetch.
- New `src/routes/sold-out.tsx` modelled on `src/routes/pre-order.tsx` (same query hook, skeleton, quick-view drawer, `head()` metadata). Add the route to `src/routes/sitemap[.]xml.ts` and a link in `src/components/site/Header.tsx`.
- `ProductCard.tsx`: keep existing badges; ensure sold-out cards disable the cart button and show the tag consistently.
- Admin: extend the products list query/filter state in `src/routes/_authenticated/admin/products.index.tsx` with a status param, add tiles in `admin/index.tsx`, small copy/validation additions in `ProductForm.tsx` and `admin/import.tsx`. No database migration needed — all fields already exist.
- Verify with a typecheck and HTTP checks on `/`, `/sold-out`, `/pre-order`, `/shop`, and `/admin`.

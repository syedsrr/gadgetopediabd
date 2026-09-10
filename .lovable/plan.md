# Pre-order section

Let customers reserve items that haven't arrived yet, with a dedicated pre-order page and a homepage row.

## What you get

**In the admin product form (new fields)**
- "Pre-order" switch — mark an upcoming item as available to reserve.
- "Expected arrival date" — shown to buyers as "Ships by 20 Sep 2026".
- "Pre-order note" — a short line you write per product (e.g. "50% advance, balance on delivery").

An item counts as pre-order when you flip that switch, or when its stock is zero and "allow backorder" is on. Both cases show the same pre-order treatment.

**Storefront**
- New page at `/pre-order`: all pre-order items in the usual product grid, sorted by soonest expected arrival, with a short intro explaining how reserving works. Empty state when nothing is on pre-order.
- Homepage row "Pre-order now" above New arrivals, showing up to 8 items with a "See all pre-orders" link. The row hides itself when nothing is on pre-order.
- Product cards: an amber "Pre-order" badge instead of the "Out of stock" overlay, button reads "Pre-order"; the arrival date under the price.
- Product page: "Pre-order" buttons instead of Add to cart / Order now, plus the expected date and your note in place of the stock line.
- Cart, checkout and order flow are unchanged — a pre-order is a normal order; stock handling already supports backorders.
- Header gets a "Pre-order" link next to Shop.

## Technical notes

- Migration on `public.products`: `is_preorder boolean not null default false`, `preorder_release_date date`, `preorder_note text`. No new tables, no policy changes — existing public read policy covers them.
- Add the three columns to `CARD_COLUMNS` in `src/lib/catalog.ts` plus a `preorderQuery`-style helper `isPreorder(product)` in `src/lib/format.ts` (`is_preorder || (stock <= 0 && allow_backorder)`), used by cards, product page, homepage and the new route.
- New route `src/routes/pre-order.tsx` with its own `head()` (title, description, og/twitter tags), loader via `context.queryClient.ensureQueryData(productsQuery)` and client-side filtering — no extra query.
- `ProductCard.tsx` and `src/routes/product.$slug.tsx` gain the pre-order branch; product JSON-LD availability becomes `PreOrder` with `priceValidUntil`/`availabilityStarts` from the release date.
- `ProductForm.tsx` gains the three inputs in the inventory section; CSV template and importer in `src/lib/csv.ts` accept `is_preorder`, `preorder_release_date`, `preorder_note`.
- Badge colour uses existing tokens (`bg-sale`-style amber token added to `src/styles.css` only if no suitable token exists).

# Categories → side-by-side arched editorial strip (homepage)

The approved direction is **v3 — "Arched editorial scroll"**: tall arched cards in one horizontal band, magazine-style typography, item counts in dark glass pills, scroll progress dots.

## What changes (homepage only — `src/routes/index.tsx`)

Replace the current 2-column category tile grid with:

1. **Header row** — keep the existing "Browse" eyebrow and "Shop by category" heading (Sora bold), plus the "All products" link on the right. Add a thin line + dot motif beside the heading as in the prototype.
2. **Horizontal scroll band**
   - All 5 categories in one side-by-side row, swipable on phones (snap scrolling, hidden scrollbar).
   - Card: arch-shaped (rounded-top) cover image, aspect 3:4, ~240px wide on mobile.
   - Count badge: dark glass pill at the top-left of each card ("15 Items").
   - Below each card: category name in bold Sora + small uppercase accent tag (e.g. "Field Essentials", "Connection Kits").
   - Gentle image zoom on hover (desktop); same links to `/category/$slug`.
3. **Scroll progress indicator** — small dark dashes under the band showing scroll position.
4. **Breakpoints** — phones: swipe with snap; tablets: ~2.5 cards visible; desktop: all 5 fit in one row (smaller arch cards) or a full row with edge padding.

## Category cover images

No category photos exist yet, so generate 5 branded covers (soft light, cream/moss backdrop, product-grouped: knives, collectibles, fans, power bank, cables) into `public/images/cat-<slug>.jpg` (webp not required), each ~800×1067. Map slugs in the component; fall back to icon-on-tone background if a category is added later without an image.

## Out of scope

Trust bar, hero, pre-order/featured/new/sold-out sections, other pages. No schema or admin changes.

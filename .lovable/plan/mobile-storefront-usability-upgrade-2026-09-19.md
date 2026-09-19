# Mobile storefront usability upgrade

## Goal
Make shopping comfortable on 360–430px screens while preserving the existing green brand style, live catalog, checkout logic, and three-dot category menu.

## Changes

### 1. Simplify mobile navigation
- Rework the top bar as a stable two-column layout so the logo never competes with the action icons.
- Increase icon tap areas to at least 44px and keep search, cart, account, and the three-dot menu easy to distinguish.
- Keep categories inside the three-dot menu, as originally requested.
- Make the search panel easier to use with a full-width field and clear close action.

### 2. Make browsing faster
- Change the mobile shop from one oversized product per row to a compact two-column grid; keep wider desktop layouts unchanged.
- Replace the separate shop-only card design with the shared product card so price, sale, pre-order, sold-out, wishlist, and cart behavior stay consistent.
- Tighten image, title, badge, price, and button spacing without reducing legibility.
- Keep category filters horizontally scrollable, but add clearer selected styling and touch-friendly controls.
- Keep search and stock filters visible and compact, with an obvious reset when no products match.

### 3. Improve product and cart actions
- Make quick-view and cart panels fill the mobile screen cleanly, scroll correctly, and keep the primary purchase action reachable near the bottom.
- Stack product-page quantity and purchase actions into full-width mobile controls.
- Prevent long names, prices, specification values, and cart totals from colliding or overflowing.
- Increase quantity and remove controls to comfortable mobile tap sizes.

### 4. Streamline cart and checkout
- Reflow each cart item into a mobile-safe grid so image, name, quantity, remove action, and total remain readable.
- Keep the cart/checkout summary prominent after the editable content and use full-width primary actions.
- Reduce unnecessary mobile spacing while retaining clear separation between delivery details and order totals.

### 5. Responsive validation
- Test the home page, shop, product details, quick view, menu, cart drawer, cart page, and checkout at 360px, 390px, and 430px widths.
- Check for horizontal overflow, clipped text, overlapping controls, inaccessible actions, and inconsistent loading/empty states.
- Preserve tablet and desktop behavior and verify all storefront routes still load successfully.

## Technical notes
- Use the existing semantic color tokens and shared UI controls; no catalog, account, order, or admin data logic changes.
- Use stable responsive grids with `min-w-0`, `shrink-0`, truncation, and fixed touch targets where text and icons share a row.
- Respect reduced-motion preferences and retain existing SEO metadata.

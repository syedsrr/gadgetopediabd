# Smaller header and trust bar icons

## Goal
On mobile the header icons (search, cart, account, menu) and the trust-bar icons (Fast delivery / 100% genuine / Warranty backed) look oversized next to the compacted layout. Shrink the icon glyphs while keeping comfortable tap targets.

## Changes

### 1. Header icons (src/components/site/Header.tsx, src/components/site/CartDrawer.tsx)
- Shrink the visible glyph on all header action icons from `h-5 w-5` to `h-[18px] w-[18px]` on mobile, staying `h-5 w-5` on desktop (`sm:` breakpoint):
  - Search / close (X) toggle
  - Account (User) — both logged-out link and logged-in trigger
  - Category menu (MoreVertical)
  - Cart (ShoppingBag) inside CartDrawer
- Keep the 44px button hit areas unchanged so taps stay easy.

### 2. Trust bar icons (src/routes/index.tsx)
- Circle badge: `h-8 w-8` → `h-6 w-6` on mobile, `sm:h-8 sm:w-8`.
- Icon inside: `h-4 w-4 sm:h-5 sm:w-5` → `h-3.5 w-3.5` on mobile, `sm:h-4 sm:w-4`.
- Row height of the trust bar shrinks automatically, bringing the content below even closer to the header.

## Verification
- Screenshot mobile (393px) and desktop (1280px) home page; confirm icons are visually lighter and nothing overlaps.
- Build passes (build-errors.log).

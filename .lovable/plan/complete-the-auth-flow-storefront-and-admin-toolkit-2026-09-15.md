# Complete the auth flow, storefront and admin toolkit

Most of this already exists in your site. This plan fills the real gaps instead of rebuilding working pages.

## Already working (no changes)
- Sign in / create account with email, phone code, Google and Apple.
- Storefront: product grid, category filters, search, individual product pages, all fed live from your catalogue.
- Protected admin area with sidebar: Dashboard, Products (add/edit/delete with image upload), Categories, CSV import, Orders.
- Admins land on the admin area, shoppers land on their account page.

## What gets added

### 1. Password reset
- A "Forgot password?" link on the sign-in screen that emails a reset link.
- A new public page where the shopper picks a new password after clicking that link.
- Signed-in shoppers can also change their password from their account settings (current password required).

### 2. A /store address for the shop
Right now the shop lives at /shop. I'll make /store open the same shop page (a redirect), so both addresses work and nothing already shared or indexed breaks.

### 3. Inventory Manager (admin)
A dedicated stock screen: every product with its stock, low-stock and sold-out highlighting, filters for sold out / low stock / pre-order, and inline stock editing with a save-all action.

### 4. User Role Management (admin)
A new admin screen listing people with accounts (name, email, phone, joined date, current role) where an admin can promote or demote between admin, staff and customer. Safeguards:
- Only admins can view or change roles.
- An admin cannot remove their own admin access (prevents locking everyone out).

## Technical notes
- New routes: `src/routes/reset-password.tsx` (public), `src/routes/store.tsx` (redirect to `/shop`), `src/routes/_authenticated/admin/inventory.tsx`, `src/routes/_authenticated/admin/users.tsx`; sidebar entries added in `admin/route.tsx`.
- Role reads/writes go through new authenticated server functions in `src/lib/adminUsers.functions.ts`, which re-verify `private.has_role(auth.uid(),'admin')` server-side before touching `user_roles`; the privileged client is imported inside the handler.
- Migration: grant admin-only INSERT/UPDATE/DELETE policies on `public.user_roles` (currently write-denied) plus a guard so an admin cannot delete their own admin row.
- Reset flow uses `resetPasswordForEmail` with `redirectTo` `${origin}/reset-password`, then `updateUser({ password })`; the signed-in change sends `current_password`.
- `robots: noindex` on the reset page; `/store` uses a router redirect so SEO stays on `/shop`.

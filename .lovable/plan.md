# Account role safety and admin lockdown — audit + hardening

## What I checked (confirmed, not assumed)

1. **Roles are set on the backend, not by the form.** New accounts get their role from a database trigger that runs when the account is created. Signup forms send only name, email, phone and password — no role field is read from the browser. So sending `role: "admin"` in a modified request does nothing.
2. **Customers cannot grant themselves a role.** The roles table rejects create, edit and delete from any signed-in user; only backend/internal code can write it. Roles are read through a separate protected check.
3. **Roles today:** 1 admin, 1 customer. So a normal signup lands as `customer`, as intended.
4. **Admin data is protected at the database level, not just in the screen.** Every product, category and order write requires the admin role check inside the database, so a customer calling the same request directly is refused.

## Two real gaps to fix

**A. Bootstrap rule is a latent risk.** The trigger says: if there are currently zero admins, the next account created becomes admin. If the last admin role row were ever removed, the next stranger who signs up would become an administrator. Fix: remove the automatic promotion; every new account becomes `customer`, and the existing admin is preserved. Admins are granted deliberately from now on.

**B. A customer reaching /admin gets a message, not a refusal.** Today a signed-in non-admin sees an "Admin access only" panel on the admin URL. Fix: reject before anything admin renders — signed out goes to sign-in, signed in without the admin role is sent straight back to /account with a short "You don't have access" notice. Nothing from the admin area is rendered or fetched in that case.

## Also included

- A short one-time verification after the changes: create a throwaway account through the signup form, confirm its role reads `customer`, confirm /admin bounces it to /account, then delete the test account.
- Document who the current admin is and how to grant admin to another staff member (backend-only action).

## Technical notes

- Migration: rewrite `public.handle_new_user()` to always insert `('customer')`, dropping the `existing_admins = 0` promotion branch. Roles stay in `public.user_roles` with `private.has_role()`; no policy relaxation.
- `src/routes/_authenticated/admin/route.tsx`: replace the in-component "Admin access only" render with a `beforeLoad` gate (`ssr: false` retained) that calls `supabase.auth.getUser()` then the admin role check, and `throw redirect({ to: "/account" })` for non-admins; keep sign-out cache teardown. Child admin routes and their queries never mount for non-admins.
- Server side stays the authority: admin CRUD runs through the browser client under RLS (`private.has_role(auth.uid(),'admin')`), and privileged server functions (`orders.functions.ts`) remain the only admin-key paths. No client-supplied role is ever trusted.
- No changes to `AuthModal`/`/auth` payloads — they already omit role.

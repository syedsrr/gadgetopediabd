# Read-only schema compatibility audit — production intelligence migration

Database checked: the live store database (PostgreSQL 17.6). Nothing was changed. I only ran one read-only query.

## 1. Verdict: BLOCKED as written (it's already been applied)

This migration, or one that matches it, is **already live**. All 16 tables, all 3 views and `public.is_marketing_staff()` are already in the database. If you run it again with plain `CREATE TABLE` / `CREATE POLICY` / `CREATE VIEW`, it fails on the first object that already exists.

## 2. Conflicts and risks

| Object | Finding |
|---|---|
| inventory_items, inventory_transactions, competitors, competitor_products, price_observations, market_prices, product_costs, cost_components, landed_costs, audit_events, marketing_campaigns, customer_segments, marketing_alerts, marketing_recommendations, marketing_reports, marketing_settings | Already exist as tables. Each has 1 policy (for example `inventory_items_staff_all`, `audit_events_staff_all`, `marketing_settings_staff_all`) using `is_marketing_staff()`. |
| product_price_intelligence, current_inventory, product_sales_analytics | Already exist as views with `security_invoker=true`. |
| public.is_marketing_staff() | Already exists. It's a SECURITY DEFINER function that checks `role::text IN ('admin','staff')`. |
| landed_costs.total_landed_cost | Already a generated column (sum of the 8 cost fields). |
| Authorization path (risk) | You now have two parallel ways of checking access: (a) `private.has_role()` / `private.has_permission()` with `role_permissions` (8 `marketing.*` permissions, granted to admins only), and (b) `public.is_marketing_staff()`, which also lets **staff** in. So staff can reach marketing data even though `role_permissions` doesn't grant them any `marketing.*` permission. |
| public.is_marketing_staff() (risk) | It's a SECURITY DEFINER function in `public`, so signed-in users can call it directly. That matches a security finding you've already fixed before (the role check was moved into `private`). |
| marketing_reports vs market_reports | Different names, so no clash. Expect confusion, though: the AI weekly reports stay in `market_reports`. |

Existing types match what the migration expects: `products.id`, `orders.id`, `order_items.order_id`/`product_id` and `user_roles.user_id` are all uuid. `user_roles.role` is enum `app_role` (admin, staff, customer). `orders.status` is enum `order_status`. `gen_random_uuid()` is available. Security-invoker views and generated columns both work on PG 17.

## 3. SQL that must change before running

- `CREATE TABLE` → `CREATE TABLE IF NOT EXISTS`, or drop these statements from the script
- `CREATE VIEW` → `CREATE OR REPLACE VIEW ... WITH (security_invoker = true)`, but only if the view definitions are meant to change
- `CREATE FUNCTION is_marketing_staff` → `CREATE OR REPLACE`, or leave it out
- `CREATE POLICY` → guard each one with a `pg_policies` existence check, or leave them out, because Postgres has no `IF NOT EXISTS` for policies
- Indexes/constraints → `CREATE INDEX IF NOT EXISTS`

## 4. Existing data affected

None. The new tables are empty (spot-checked: inventory_items, audit_events, marketing_settings and landed_costs all have 0 rows). Core tables (products, orders, order_items, user_roles, profiles, product_images, product_specifications, market_reports) aren't touched.

## 5. Corrected strategy

1. Don't re-run the migration. Treat it as already applied.
2. If you want any later changes, write them as a small new migration that only adds the difference (idempotent).
3. Recommended hardening, in its own migration once you approve it:
   - Move the role check into `private.is_marketing_staff()` and repoint the 16 policies to it. Then revoke EXECUTE on the `public` version from anon and authenticated.
   - Pick one authorization model. Either grant staff the right `marketing.*` rows in `role_permissions` and base policies on `private.has_permission()`, or officially decide that marketing is admin+staff and write that down.

## 6. Confirmation

I made no changes: no DDL, no DML, no grants, no policy or function edits, no code edits, no installs and no config changes.

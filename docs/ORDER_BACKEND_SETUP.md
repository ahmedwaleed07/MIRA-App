# MIRA Customer → Merchant Order Integration

The web checkout, direct offer checkout, merchant dashboard and My Orders tracking all use `public.mira_orders`.

## Current source changes

- `docs/cart.html` always routes checkout through the authenticated customer gate. Guest browsing and cart storage remain intact.
- `docs/checkout.html` verifies the customer's session with Supabase before ordering and splits multi-store carts into one order per store.
- `docs/offer.html` verifies the customer session for direct orders and blocks double submission.
- `docs/business.html` limits status updates to the current store and trusts **only** the status acknowledged in a database response.
- `docs/orders.html` retrieves only the authenticated customer's orders and refreshes while the page is visible.
- `scripts/validate-order-flow.mjs` uses mocked requests to exercise customer checkout, partial-send recovery, merchant update and customer tracking.
- `scripts/validate-order-contract.mjs` checks the same table/columns and access-control contract across these files and the SQL migration.

## Supabase database migration — action required

**The GitHub repository does not deploy SQL migrations to Supabase automatically.** Confirm which Supabase project powers MIRA, inspect the existing `public.mira_orders` table and **all existing RLS policies**, and then apply:

`supabase/migrations/20261009_mira_web_orders_contract.sql`

Prerequisite: `public.mira_merchants` must exist with `user_id` and `store_id` fields. Its assignments must reflect MIRA Business users. The migration deliberately fails if it cannot find this table. The older `orders` / `order_items` tables are a **separate schema** and are not deleted, modified or automatically synchronized.

If `mira_orders` is already in production, review its exact schema and any permissive policies before running the migration. The new policies do **not** automatically remove other pre-existing policies. Do not rely on client-side filters to protect customer addresses.

Useful checks in the Supabase SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema='public' and table_name in ('mira_orders','mira_merchants','mira_order_status_history');

select tablename,policyname,cmd,roles,qual,with_check
from pg_policies
where schemaname='public' and tablename in ('mira_orders','mira_order_status_history')
order by tablename,policyname;
```

## Final live smoke test (test users only)

1. Create a customer and sign in. Browse as a guest first, add an offer to the cart, and verify the cart remains intact when asked to sign in at checkout.
2. Use two approved test merchants with working `mira_merchants` assignments. Place an order with offers from both stores. Confirm two separate orders appear, with the customer's name, primary and backup numbers, governorate, area, address and optional note.
3. Sign into Merchant A. Confirm Merchant A sees its order, **not** Merchant B's. Update status from `new` to `accepted`.
4. Return to the customer account → My Orders, refresh and confirm `accepted` is shown with the correct order.
5. From Merchant B, attempt to update Merchant A's order: the database must reject it, return no confirmed row, and the UI must show an error rather than claiming success.
6. Sign in as an unrelated customer, query the first customer's orders directly via the REST API and verify RLS rejects/returns no records.
7. Verify the status audit row exists and current order data cannot be overwritten by a status-update request.
8. Test a network interruption after sending the first store's order. Confirm only the unsent merchant remains in the local cart. Before retrying an ambiguous network failure, inspect My Orders to avoid a duplicate.

**Limitations before production:** Frontend-driven order prices are not trusted payment totals. Implement server-side catalog/price validation and an idempotency key when adding online payments. Current tests simulate the API; they cannot prove SMS delivery, live database RLS enforcement or a merchant notification until Supabase is connected and test accounts are available.

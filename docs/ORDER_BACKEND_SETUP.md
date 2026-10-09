# MIRA Customer → Merchant orders — production status

The live Supabase project is `xjspokwtikefpgwczehp`. The production `public.mira_orders` table already existed before these changes and contains customer orders; the client pages rely on this table.

## Production schema — IMPORTANT

**Do not apply `supabase/migrations/20261009_mira_web_orders_contract.sql` to the existing MIRA production database.** That earlier draft describes a fresh-instance table and differs from the live schema, particularly nullable fields and the existing foreign key; attempting to overlay it is not the approved deployment path.

The correct additive migration was deployed on 2026-10-09:

`supabase/migrations/20261009_mira_live_order_status_history.sql`

It left existing `mira_orders` data, RLS policies and `mira_merchants` assignments intact. It created the `mira_order_status_history` table, an AFTER INSERT/UPDATE OF status trigger, a safe SELECT policy limited to authorized order participants via the existing `mira_orders` RLS, and an initial event for the existing order.

## Verified in UI and automated tests

- Guest shopping/cart remains available. Before checkout, the customer signs in.
- Multi-merchant carts create one order per merchant and keep unsubmitted items if an operation fails.
- Direct offer ordering requires a verified customer account and prevents accidental repeated clicks.
- Merchant status updates are limited to their assigned store and require server acknowledgement.
- Customer My Orders displays current merchant status.
- Automatic in-app customer notifications can read historic status events after app reopen.

`scripts/validate-order-flow.mjs`, `scripts/validate-order-contract.mjs`, and `scripts/validate-notifications.mjs` provide mocked end-to-end and contract regression tests.

## Remaining acceptance checks

Sign in as a real **test** customer, place orders from two approved test stores, inspect both merchants' lists, change status in Business, refresh My Orders and the Notifications inbox, and confirm unauthorized customer or merchant access fails against the **live REST API**.

This is not proof of background phone push, inventory controls or payment-grade pricing. Confirm catalog prices on the server and add idempotency before accepting online payments. No customer order was created, changed or deleted by the schema migration/permission tests.

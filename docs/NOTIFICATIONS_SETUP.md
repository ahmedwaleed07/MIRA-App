# MIRA Notifications — live activation record

Last verified: 2026-10-09. Supabase project `xjspokwtikefpgwczehp` is connected to the MIRA client.

## Two types of customer notifications

1. **Automatic**: new order, confirmation, preparation, shipment, out for delivery, delivery and cancellation; the merchant receives new-order alerts too.
2. **Manual from MIRA**: an authorized Admin writes title, body and an optional safe in-app link, and targets **everyone**, a **selected shopping market**, or **one customer by Supabase Auth UUID**.

- Customer interface: `docs/notifications.html` (five languages), Home bell, unread badge, and Profile entry.
- Admin interface: `docs/admin.html` → Notifications.
- Merchant interface: `docs/business.html` → Orders → new-order alerts.
- Automatic status changes come from the **server-side history trigger**; historical events are replayed when the user next opens the app.
- Read flags are cached separately for each account and synchronized through Supabase between devices when logged in.

## Deployed database migrations

The following migrations **were applied successfully to the connected Supabase production project** on 2026-10-09:

| Migration | Purpose |
| --- | --- |
| `mira_live_order_status_history` | Existing `mira_orders` table gets a non-destructive event history trigger; existing order was backfilled. |
| `mira_manual_notifications` | Admin campaigns, targeting, publisher membership and RLS. |
| `mira_notification_reads` | Private, account-scoped read receipts across devices. |
| `mira_notification_function_permissions` | Remove unnecessary external execution of privileged functions. |
| `mira_notification_invoker_permissions` | Run Admin membership checks as caller under RLS rather than as SECURITY DEFINER. |

The existing approved MIRA Admin Auth account was granted membership in `mira_notification_admins` after matching the prior live Admin order-access policy. Do not add any other publisher without explicit approval.

**Important schema warning:** The existing production `mira_orders` table is not identical to the older *prototype* file `20261009_mira_web_orders_contract.sql`. **Do not apply that original create-table migration to this live database**. The additive `20261009_mira_live_order_status_history.sql` migration was designed for the actual production schema and has already been deployed.

## Verified behavior

- New tables and their RLS policies exist and are enabled.
- Approved administrator can publish a private notification (transaction was rolled back, **no test message persisted**).
- A separate simulated authenticated account cannot see the Admin publisher membership and cannot publish.
- Authenticated user can write their own read receipt (transaction rolled back).
- Existing production orders and merchant mapping remain intact.
- Supabase security advisors no longer report privileged notification functions exposed to anonymous users or externally callable trigger functions.

A separate Supabase security advisor warning remains: **Leaked Password Protection is disabled**. Enable it for the Auth provider before the public launch: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Final hands-on acceptance test

Log in at `docs/admin.html` with the approved Admin user, open Notifications and publish a harmless message to **one test customer's Auth UUID**. Open `docs/notifications.html` in that customer's authenticated session to confirm in-app arrival. Then place a test order and have the merchant update its status from Business to verify automatic order events. Mark one read on one device and check its state on another.

Never use live customer contact information or marketing recipients for testing. If a customer is browsing in Guest mode, no private notifications can be read.

## Delivery limitation

The implementation provides **in-app notifications**, available when MIRA is open and refreshed or when the user returns. **APNs/FCM/native push or Web Push to a locked phone are not yet configured.** This requires secure device tokens, customer consent, push provider credentials, and a trusted server-side sender.

Automated tests (`scripts/validate-notifications.mjs`) exercise both channels and RLS contract checks, but mock network responses do not substitute for an actual customer/merchant login acceptance test.

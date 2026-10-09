# MIRA Notifications — two customer channels

This feature supports **in-app** notifications:

1. **Automatic**: order received, confirmed, preparing, shipped, out for delivery, delivered, cancelled. Customer notifications are generated from **their own** \`mira_orders\` events and shown in their own MIRA inbox. MIRA Business also alerts a merchant about newly received customer orders.
2. **Selected by MIRA**: Admin writes a subject and message, optionally chooses an internal destination, then targets **all customers**, **a MIRA shopping country**, or **one customer by Supabase Auth UUID**.

## Screens and client logic

- Customer inbox: \`docs/notifications.html\` (five languages), tabs **All / Automatic / From MIRA**.
- Home: bell and unread count; Profile: Notifications row.
- Admin: Notifications panel with audience, title, body, link and recently published history.
- Merchant: New order alerts next to Orders.
- JavaScript: \`docs/mira-notifications.js\` (customer/merchant account-scoped inbox, polling and read flags) and \`docs/mira-admin-notifications.js\` (publisher allow-list check and composer).

The unread/read state is currently saved to **this device/browser for the authenticated account**, not synced across multiple devices.

## Activate on Supabase (required before sending manual notifications)

**GitHub Pages does not execute database SQL migrations.** Supabase needs a trusted admin connection.

1. Confirm you are operating on MIRA's correct Supabase project, then review existing tables and policies.
2. Apply \`supabase/migrations/20261009_mira_manual_notifications.sql\` in the Supabase SQL Editor.
3. Grant the designated Admin *Supabase Auth UUID* access using the SQL Editor with privileges, **not** the browser or publishable API key:

   \`\`\`sql
   insert into public.mira_notification_admins(user_id)
   values ('REPLACE-WITH-TRUSTED-ADMIN-UUID')
   on conflict (user_id) do nothing;
   \`\`\`

4. Login to \`admin.html\` with that user, open **Notifications**, compose a test to one customer ID, then check \`notifications.html\` while signed in as that customer.
5. Test a broadcast and a country-specific notification, then test that another customer cannot see the personal message; inspect REST RLS and allowed publishers.
6. Confirm the deployed \`public.mira_orders\` schema/RLS is healthy so order-state notifications load. See \`ORDER_BACKEND_SETUP.md\`.

Publishing permissions are enforced **in the database**, not only by hiding Admin controls. The market filter is intentionally based on the customer's selected shopping country, which can change. Do not include sensitive information in a country-targeted announcement. For private notices use a recipient UUID.

**Important:** This is in-app delivery while the MIRA website/app is active, or when the user next opens it. Background push to a locked phone (APNs/FCM/Web Push) is **not active**; it requires production server push, signed push tokens, customer permission prompts, secure per-device registrations and delivery/error handling. Do not promise device push from the in-app inbox.

## CI

\`node scripts/validate-notifications.mjs\` checks duplicate prevention, account separation, market and individual targeting, read state, allowed links, merchant alerts, RLS statements and authenticated API calls.

# MIRA Notifications — customer delivery and setup

The MIRA inbox supports **two customer channels**, with a branded Home bell and an unread count:

1. **Automatic:** customer order receipt, confirmation, preparation, shipment, out for delivery, delivery and cancellation; new-order alerts also appear in Business.
2. **MIRA-curated:** authorized administrators compose a title, message and optional internal MIRA link for all customers, a shopping country or a specific customer's Supabase Auth UUID.

Customer UI: `docs/notifications.html` with All / Automatic / From MIRA tabs and five languages. Admin UI: `docs/admin.html`, Notifications panel.

The notifications system uses authenticated Supabase requests, and preserves each account's local notification cache. If its database tables are deployed, automatic events also replay from the server's `mira_order_status_history`, and read/unread flags sync between the customer's devices through `mira_notification_reads`. If a migration is missing, the UI falls back to local state and logs the unavailable feature.

## Activate the live backend

**GitHub Pages deployment never applies Supabase migrations.** Connect the correct MIRA Supabase project with privileged admin access, inspect existing table definitions and policies, then carefully apply these migrations:

- `supabase/migrations/20261009_mira_web_orders_contract.sql` — orders, merchant membership gate and server-generated status-event history. Check prerequisites and audit existing policies first.
- `supabase/migrations/20261009_mira_manual_notifications.sql` — admin-approved manual notices and recipient targeting.
- `supabase/migrations/20261009_mira_notification_reads.sql` — private read receipts for cross-device synchronization.

Grant notification-publisher access to the designated **trusted Supabase Auth UUID**, using the Supabase SQL Editor with privileged access — never through the client/publishable key:

```sql
insert into public.mira_notification_admins (user_id)
values ('REPLACE-WITH-TRUSTED-ADMIN-UUID')
on conflict (user_id) do nothing;
```

The Admin UI checks the same server-backed allow-list at publication time. Other customers and merchants must not be allowed to insert manual notifications or grant publisher membership.

Country-targeted messages are filtered by the customer's *selected shopping market*, which is a changeable preference, not a verified country. Do not send confidential content in country-wide notices. For private notices use the customer's UUID.

## Actual acceptance test

1. Sign into a verified customer account, submit a **test** checkout order, and confirm a new automatic notification appears.
2. Update its status from the associated authorized merchant Business account. Verify the customer receives a new alert without duplicating prior events.
3. Using a trusted MIRA Admin account, send a notice to one test customer's UUID and check that only that customer can see the notice.
4. Send an all-customer notice, and then a shopping-country-targeted notice. Switch the customer's market to check audience filtering.
5. Mark a notification read on Device A, open the same customer account on Device B, and verify the read state synchronizes.
6. Sign into another customer account and test that Supabase RLS prevents access to the first customer's private order notifications or read receipts.
7. Check `mira_notification_admins` and `mira_manual_notifications` access with a merchant account; unauthorized publishing must fail on the server.
8. Test offline and restoration; local notifications should remain and server events sync on reopening.

**In-app delivery only:** These notifications appear while MIRA is open or next opened. Device-level background push to a locked phone is **not configured**. Native APNs/FCM or Web Push would additionally require secure device registration, delivery provider credentials, opt-in permissions and a server-side sender. Never claim push is active based on the inbox alone.

## Automated checks

Run `node scripts/validate-notifications.mjs`, plus the repository's `MIRA Validation` workflow. Checks cover automatic history replay, manual targeting, duplicate avoidance, account isolation, read syncing, destination safety, SQL policy requirements and authenticated requests. Mock checks do **not** replace the real Supabase acceptance test.

# MIRA Customer Notifications — Launch Scope

Five interface languages: AR / EN / ES / RU / TR. Private events are scoped by verified Supabase user ID.

## What a signed-in customer sees

1. **My Orders:** Order received, accepted/confirmed, preparing, ready, out for delivery, completed, cancelled. Events are based on actual server-side order history, not decorative timers.
2. **My Listings & Reports:** Decisions on the user's own Friday Market or Direct Car Sale listings (approved, rejected, hidden); outcomes of reports they submitted (action taken or dismissed). Pending listing submission shows a confirmation in the posting form, not a false publication notification.
3. **From MIRA:** Only Admin-published in-app announcements and selected offers, scoped to everyone, the customer's market or one specified customer. Must never expose other customers' private information.
4. **Read/unread:** per authenticated account, stored locally and synced via `mira_notification_reads`; opening an event marks it read.

The UI has four filters: All, Automatic, From MIRA, My Listings & Reports. The Home unread badge counts all unread customer events.

## What does not show by default

- Orders or account information belonging to other customers or merchants.
- Hidden or rejected listing details from other sellers.
- Admin moderation queue, personal reporter identity, seller personal account UUIDs.
- A flood of per-photo upload progress messages, or duplicate events.
- Promotional push notifications without a consent / preference setting.

## Delivery channel

Currently **in-app only** while MIRA opens or refreshes. Locked-screen push requires APNs / FCM registration, per-device token handling, customer permission and a protected server sender; it has **not** been implemented, so no locked-phone delivery should be promised.

## Hands-on acceptance test

1. Publish a sample item and vehicle as a customer. Verify no public visibility until an authorized admin approves each.
2. Admin rejects one and approves one. Confirm the correct owner sees the decision under My Listings & Reports, and unrelated accounts do not.
3. Report one live listing with reason + details. Admin hides or dismisses it and the reporter receives a status update.
4. Test an order from a distinct customer and status updates from its actual assigned merchant. Verify customer notification & unread receipts survive reload/login on another browser.
5. Confirm language labels and the footer switcher in all 5 languages across the web app and native packaged app.

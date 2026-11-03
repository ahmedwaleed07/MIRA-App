# MIRA — Verification on Cloudflare (provider pending)

## Active infrastructure (3 November 2026)

- Cloudflare Pages project: `mira-app`; site: https://mira-app-dz5.pages.dev
- Cloudflare D1 database: `mira-friday-market`, bound to Pages Functions as `MIRA_OTP_DB`.
- Production secret: `MIRA_OTP_PEPPER` is stored **only** as a Cloudflare secret. Do not copy it into GitHub.
- API:
  - `GET /api/otp/policy` — channel, readiness and limits.
  - `POST /api/otp/request` — ask for a WhatsApp verification code, protected by D1, currently **fail-closed**.
  - `POST /api/otp/verify` — validate a six-digit code against a one-use HMAC challenge.
- Cloudflare D1 schema file: `cloudflare/migrations/20261103_mira_otp.sql`.
- Browser phone-OTP requests must call Cloudflare. Existing optional email magic-link flow remains unchanged pending full identity migration.

## Rate rules (enforced by Cloudflare D1)

1. One accepted phone send per **60 seconds**.
2. At most **3 accepted sends per number in a rolling 30-minute window**.
3. At most **12 accepted sends per source IP in a rolling hour** to stop bulk abuse.
4. OTP expires in **5 minutes** and is one-use. Wrong codes lock after five wrong attempts.
5. Signup sends are skipped for already verified, registered numbers; sign-in requests remain available for registered numbers.
6. Verified signup numbers remain in a **pending registration** table for 15 minutes. A phone is moved to the registered table **only after successful account creation**.
7. Only HMAC digests of phone/IP/code are stored. No raw OTP in D1. No product payments involved.

## Fail-closed release checklist

These are **NOT done** and must be resolved before claiming production verification:

- Select an approved WhatsApp Business official Authentication-template provider. Configure a private Cloudflare Worker adapter and bind it to Pages as `MIRA_OTP_SENDER`. Do not assume a generic provider API is compatible.
- Configure Cloudflare Turnstile and bind secret as `MIRA_TURNSTILE_SECRET`. Add site key and token to User and Business login screens.
- Import verified existing phone identities into `mira_otp_registered` safely (without returning registration status to unauthenticated callers); the existing customer identity/session backend needs migration or a secure bridge. **Never make an OTP proof itself a signed-in MIRA session.**
- Finish server-issued session integration with the remaining User/Business/Admin application authorization model. Current Cloudflare OTP verify intentionally returns `authSessionReady:false`, and the browser refuses to treat it as a login.
- Verify on real Iraqi phone numbers across Zain/Asiacell/Korek, including WhatsApp-disabled accounts, resend, failure refunds, load, blocked cases, duplicate registered signup and sign-in.
- Confirm the old direct phone sending endpoint cannot bypass this gate before enabling the WhatsApp provider.
- Do not expose `MIRA_OTP_PEPPER`, vendor access tokens, Turnstile secret or internal adapter service directly in client code.

## Behavior prior to official provider setup

`POST /api/otp/request` returns HTTP 503 `whatsapp_provider_not_configured` **without generating a code or charging anyone**. This is intentional: the user still needs to choose the sender, and SMS/WhatsApp delivery is not claimed complete.

The signup page offers email as an optional fallback; it may remain available while WhatsApp onboarding is incomplete. Phone login remains unavailable rather than bypassing Cloudflare security.

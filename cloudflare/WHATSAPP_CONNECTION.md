# MIRA WhatsApp Cloud API — connected account setup (not active yet)

This code provides the PRIVATE sender Worker used by the already-existing Cloudflare Pages OTP function. **Never expose the Worker through a public workers.dev URL or route.** No message is sent until the Meta account, approved template, credentials, bot challenge and binding are all configured.

## 1. Meta account action

- Open https://developers.facebook.com/apps/ and select/create the MIRA app (WhatsApp use case).
- Select the business portfolio that owns the WhatsApp Business Account (WABA).
- Add and verify a dedicated sender phone number. Register the number and enable required verification.
- Get the **Phone Number ID**, WABA ID and Graph API version from WhatsApp API Setup.
- In WhatsApp Manager, create an approved **AUTHENTICATION** copy-code template named \`mira_authentication\`, with one locale e.g. \`ar\`. This is Meta-controlled preset text, not an arbitrary custom message.
- Create a system-user access token scoped to the business/app with the required WhatsApp messaging permission. Do not put the token in GitHub or user chat.

## 2. Cloudflare secure adapter (provision only when Meta is ready)

- Deploy \`cloudflare/mira-whatsapp-sender\` as a separate Cloudflare Worker named \`mira-whatsapp-sender\`, using its wrangler.toml; \`workers_dev = false\` and no custom routes.
- Add Worker secret \`META_WHATSAPP_ACCESS_TOKEN\`. Add Worker variables \`META_PHONE_NUMBER_ID\`, \`META_GRAPH_VERSION\` and \`META_TEMPLATE_LANGUAGE\` for the **exact approved** template locale.
- Under Cloudflare Workers & Pages → Pages → \`mira-app\` → Settings → Bindings, add a **Service binding** with variable name \`MIRA_OTP_SENDER\`, pointing to Worker \`mira-whatsapp-sender\`. Deploy the Pages project again.
- Create a Cloudflare Turnstile site key/secret, configure \`MIRA_TURNSTILE_SECRET\` only as a Pages production secret, and integrate the site widget with both MIRA User and MIRA Business OTP screens.
- Only after Turnstile works, existing verified identities are safely synchronized and the account/session bridge is finished, run an end-to-end test using a real WhatsApp-enabled phone.

## 3. Security and readiness constraints

- **Do not** paste any Meta Access Token or app secret in chats, screenshots or GitHub.
- Existing \`MIRA_OTP_DB\` and \`MIRA_OTP_PEPPER\` remain the source of OTP anti-abuse and code verification.
- The sender accepts only the internal \`https://mira-otp-internal/send\` POST, 6-digit codes, E.164 numbers and \`mira_authentication\`. Meta's accepted response is not proof of delivery; delivery-status webhooks should be integrated before production.
- Existing \`/api/otp/verify\` returns \`authSessionReady:false\`; **OTP verification alone must not sign users in**.
- Keep User/Business/iOS/Android on the same approved source and preserve the 60-second resend restriction and 3 sends / 30 minutes.
- A staging dry run should be completed before switching on real delivery, and production should stay fail-closed until all release gates pass.

Meta references:
- https://www.postman.com/meta/whatsapp-business-platform/request/6vkv46u/create-authentication-template-w-otp-copy-code-button
- https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text

Cloudflare Service binding:
- https://developers.cloudflare.com/pages/functions/bindings/#service-bindings

## 4. Staged, fail-closed deployment (November 2026)

- Worker `mira-whatsapp-sender` can be deployed with `workers.dev` and previews disabled **without any Meta credentials**.
- `MIRA_META_SENDING_ENABLED` is absent by default: the private Worker always returns HTTP 503 and **never calls Meta**.
- `MIRA_OTP_LIVE_ENABLED` is absent by default on the Pages project: `/api/otp/request` always returns HTTP 503 and **never creates a paid request**, even if someone creates a Service binding later.
- Do not switch either flag to the exact string `true` until the approved Meta phone/template, Turnstile validation, rate-limit tests, account sessions, verified registration import, and delivery-state webhook flow have passed their security and business checks.
- Once that approval is complete, add Meta credentials privately under Cloudflare Worker secrets/settings, configure Turnstile and the Service binding, deploy to a nonproduction environment, and run a controlled test with an authorized recipient phone number.

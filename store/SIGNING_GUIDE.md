# MIRA 1.0 — Signing and Store Distribution (Android / iOS)

Current application ID / Bundle ID: `com.asas360.mira`. GitHub CI builds **an unsigned Android AAB** and **an iOS simulator build**. Neither is an App Store submission.

## One-source build guarantee

`docs/` is the approved MIRA web source. `npm run prepare:web` copies the complete current MIRA pages, styles, images and scripts into `www/`. Both GitHub Actions native build jobs run it before `npx cap add` and `npx cap sync`. `npm run sync` also does this. Do not manually patch `www/`; your edits will be replaced by the next build.

Cloudflare Pages project `mira-app` has GitHub source `ahmedwaleed07/MIRA-App`, production branch `main`, output folder `docs`. GitHub Pages publishes `docs/` too.

## Android (Google Play)

1. On your development PC, clone the repo and run `npm install`, then `npm run sync`.
2. Run `npx cap open android` (Android Studio). Build > Generate Signed Bundle / APK > **Android App Bundle**.
3. Select **Create new** upload keystore (JKS), set strong passwords and an upload key alias. Save a backup of the JKS and passwords **outside GitHub** in two secure places.
4. Choose the upload keystore, sign the Release App Bundle, and generate the signed `.aab`.
5. Create application `com.asas360.mira` in Google Play Console, enroll in Play App Signing, upload the signed AAB to internal/closed testing, complete Data Safety, content ratings, privacy / account deletion, screenshots and release details.
6. Test on a physical Android device; then move to the required production track after Play Console eligibility checks.

The private JKS and passwords must **never** be committed to GitHub or sent in a chat. A successful unsigned CI artifact does not constitute a signed AAB.

Official Android reference: https://developer.android.com/studio/publish/app-signing

## iOS (Apple App Store)

1. On a **Mac** with Xcode, run `npm install`, `npm run sync`, and `npx cap open ios`.
2. In Xcode open App target > Signing & Capabilities, choose your paid Apple Developer Team, keep Bundle Identifier `com.asas360.mira`, and check **Automatically manage signing**.
3. Set Version and increment Build number. Select **Any iOS Device (arm64)** as destination, Product > Archive.
4. Open Xcode Organizer > Archives > Distribute App > **TestFlight & App Store**, confirm signing and upload to App Store Connect.
5. Use TestFlight to verify a real signup, OTP, session resume, marketplace moderation, reporting, customer notifications, account deletion and business/admin behavior before App Review.

Do not place Apple private certificates or App Store Connect private keys in the repository.

Official Apple reference: https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases

## Launch blockers independent of successful signing

- A real Iraqi SMS/WhatsApp OTP provider must be configured, and device login tested.
- Moderation and report flow must be exercised with a **real test user** and approved admin, not only scripted checks.
- A real customer and merchant must complete the order / notifications journey. Confirm roles and row-level security.
- Support and privacy disclosures / user-generated content controls must be verified against current store policies.
- MIRA only rents advertising/display space; merchants and private sellers collect product payments directly, not MIRA.

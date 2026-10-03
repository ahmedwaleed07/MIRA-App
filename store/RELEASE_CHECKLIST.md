# MIRA 1.0.0 — Store Release Checklist

## Locked identity
- App name: MIRA
- Bundle/Application ID: com.asas360.mira
- Version: 1.0.0
- Welcome/brand artwork: locked to approved MIRA references in the repository.

## Code/build status
- Web application validation: PASS
- Capacitor project generation: PASS
- Android release bundle build (unsigned): PASS
- iOS simulator/native project build: PASS

## Required before submission
### Apple App Store
- Open generated iOS project in Xcode.
- Select the Apple Developer Team for `com.asas360.mira`.
- Confirm version/build number.
- Archive for `Any iOS Device (arm64)`.
- Validate archive and upload to App Store Connect.
- Add screenshots, age rating, privacy answers, support URL, privacy-policy URL, and review contact.

### Google Play
- Create/use upload keystore for `com.asas360.mira`.
- Build/sign release AAB with the upload key.
- Upload AAB to Play Console.
- Complete Data safety, content rating, app access, ads declaration, target audience, privacy policy, screenshots and store listing.

## Public policy pages
- Privacy: docs/privacy.html
- Terms: docs/terms.html
- Account deletion: docs/delete-account.html

## Important
The repository contains no Apple certificates, provisioning profiles, private keys, Google upload keystore, or store-account credentials. Those must remain under the account owner's control and are the only external credentials needed for final signing/upload.

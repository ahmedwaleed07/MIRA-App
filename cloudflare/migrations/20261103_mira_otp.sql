-- Cloudflare D1 schema for MIRA: account lookup, 60-second spacing and 3 sends / 30 min.
-- D1 database: mira-friday-market. Run with Wrangler D1 execute or Cloudflare D1 console.
-- Contains HMAC digests only. Never store plaintext phone numbers or OTP values.
CREATE TABLE IF NOT EXISTS mira_otp_send_log (
 id TEXT PRIMARY KEY, phone_hmac TEXT NOT NULL, ip_hmac TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','sent','failed'))
);
CREATE INDEX IF NOT EXISTS mira_otp_phone_idx ON mira_otp_send_log(phone_hmac,created_at DESC);
CREATE INDEX IF NOT EXISTS mira_otp_ip_idx ON mira_otp_send_log(ip_hmac,created_at DESC);
CREATE TABLE IF NOT EXISTS mira_otp_challenges (
 id TEXT PRIMARY KEY, phone_hmac TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('signup','signin')),
 code_hmac TEXT NOT NULL, issued_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,
 wrong_attempts INTEGER NOT NULL DEFAULT 0, used_at INTEGER,
 CHECK(wrong_attempts BETWEEN 0 AND 5)
);
CREATE INDEX IF NOT EXISTS mira_otp_challenge_phone_idx ON mira_otp_challenges(phone_hmac,issued_at DESC);
CREATE TABLE IF NOT EXISTS mira_otp_registered (
 phone_hmac TEXT PRIMARY KEY, registered_at INTEGER NOT NULL,verified_at INTEGER NOT NULL
);

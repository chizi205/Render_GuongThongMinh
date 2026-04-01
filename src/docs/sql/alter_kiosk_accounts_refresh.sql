-- Thêm cột để lưu refresh token (hash) cho kiosk
ALTER TABLE kiosk_accounts
  ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_expiry TIMESTAMPTZ;

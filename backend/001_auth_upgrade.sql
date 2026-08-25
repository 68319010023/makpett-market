-- ============================================================
-- Migration: 001_auth_upgrade.sql
-- Purpose  : Auth & User Management Upgrade (per ใบสั่งงาน)
-- Notes    : Additive only. Safe to re-run (IF NOT EXISTS guards).
--            Run this AFTER your existing init.sql (users, profiles).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) users table: add RBAC + brute-force + email-verify columns
-- ------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

-- Restrict role to known values (drop first so re-running the
-- migration doesn't error on "constraint already exists")
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

-- ------------------------------------------------------------
-- 2) profiles table: add avatar_url
--    (your init.sql already has this column — safe no-op)
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;

-- ------------------------------------------------------------
-- 3) email_verification_tokens
--    user_id is UUID to match users.id in your init.sql
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);

-- ------------------------------------------------------------
-- 4) password_reset_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  is_used     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);

-- ------------------------------------------------------------
-- 5) login_activity_log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address  VARCHAR(64),
  user_agent  TEXT,
  status      VARCHAR(20) NOT NULL, -- 'success' | 'failed' | 'locked'
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lal_user_id ON login_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lal_created_at ON login_activity_log(created_at);

COMMIT;

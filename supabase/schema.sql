-- DreamBreeze Database Schema
-- Supabase PostgreSQL with Row Level Security
--
-- All tables enforce RLS: users can only access their own data.
-- Sensitive data (preferences, consent records) is stored as JSONB.
-- Supabase provides encryption at rest by default.

-- ============================================================================
-- Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  display_name  TEXT,
  preferences   JSONB DEFAULT '{}'::JSONB,
  consent_record JSONB DEFAULT '{}'::JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles with preferences and consent records.';

-- Auto-update `updated_at` on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: users can only see and modify their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- 2. Sleep Sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS sleep_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ,
  sleep_score       INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
  total_duration_min INTEGER DEFAULT 0,
  deep_sleep_min    INTEGER DEFAULT 0,
  rem_sleep_min     INTEGER DEFAULT 0,
  light_sleep_min   INTEGER DEFAULT 0,
  awake_min         INTEGER DEFAULT 0,
  posture_changes   INTEGER DEFAULT 0,
  avg_fan_speed     REAL DEFAULT 0,
  summary_text      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sleep_sessions IS 'Completed sleep session summaries (not raw sensor data).';

CREATE INDEX idx_sleep_sessions_user_id ON sleep_sessions(user_id);
CREATE INDEX idx_sleep_sessions_start_time ON sleep_sessions(start_time DESC);

-- RLS
ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sleep_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sleep_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sleep_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sleep_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Sleep Events
-- ============================================================================

CREATE TYPE sleep_event_type AS ENUM (
  'posture_change',
  'stage_change',
  'fan_adjustment',
  'sound_change'
);

CREATE TABLE IF NOT EXISTS sleep_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sleep_sessions(id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ NOT NULL,
  event_type  sleep_event_type NOT NULL,
  event_data  JSONB DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sleep_events IS 'Granular events within a sleep session (posture changes, stage transitions, etc.).';

CREATE INDEX idx_sleep_events_session_id ON sleep_events(session_id);
CREATE INDEX idx_sleep_events_timestamp ON sleep_events(timestamp);
CREATE INDEX idx_sleep_events_type ON sleep_events(event_type);

-- RLS: access controlled via session ownership
ALTER TABLE sleep_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session events"
  ON sleep_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sleep_sessions
      WHERE sleep_sessions.id = sleep_events.session_id
        AND sleep_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session events"
  ON sleep_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sleep_sessions
      WHERE sleep_sessions.id = sleep_events.session_id
        AND sleep_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session events"
  ON sleep_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sleep_sessions
      WHERE sleep_sessions.id = sleep_events.session_id
        AND sleep_sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Fan Configs
-- ============================================================================

CREATE TABLE IF NOT EXISTS fan_configs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL CHECK (config_type IN ('mqtt', 'webhook', 'demo')),
  config_data JSONB DEFAULT '{}'::JSONB,
  is_active   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE fan_configs IS 'User fan connection configurations (MQTT, webhook, or demo).';

CREATE INDEX idx_fan_configs_user_id ON fan_configs(user_id);

-- RLS
ALTER TABLE fan_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fan configs"
  ON fan_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fan configs"
  ON fan_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fan configs"
  ON fan_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fan configs"
  ON fan_configs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Consent Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purpose     TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('granted', 'revoked')),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash     TEXT  -- SHA-256 hash of the IP address (not raw IP for privacy)
);

COMMENT ON TABLE consent_log IS 'Immutable audit trail of consent actions for regulatory compliance.';

CREATE INDEX idx_consent_log_user_id ON consent_log(user_id);
CREATE INDEX idx_consent_log_timestamp ON consent_log(timestamp DESC);

-- RLS
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent log"
  ON consent_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent log"
  ON consent_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: consent log entries are immutable — no UPDATE or DELETE policies.
-- Deletion happens only via cascade (profile deletion) or admin action.

-- ============================================================================
-- 6. Helper: Auto-create profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

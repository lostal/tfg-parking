-- Migration: User Preferences and Microsoft 365 Integration
-- Description: Tables for user settings, notification preferences, and Microsoft OAuth tokens

-- =====================================================
-- TABLE: user_preferences
-- =====================================================
-- Stores user-specific settings for notifications, parking, and UI preferences

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- ==========================================
  -- NOTIFICATION PREFERENCES
  -- ==========================================
  -- Channel: teams (via bot), email (Outlook/Resend), or both
  notification_channel TEXT NOT NULL DEFAULT 'teams'
    CHECK (notification_channel IN ('teams', 'email', 'both')),

  -- Notification types (channel-agnostic)
  notify_reservation_confirmed BOOLEAN NOT NULL DEFAULT true,
  notify_reservation_reminder BOOLEAN NOT NULL DEFAULT true,
  notify_cession_reserved BOOLEAN NOT NULL DEFAULT true,
  notify_alert_triggered BOOLEAN NOT NULL DEFAULT true,
  notify_visitor_confirmed BOOLEAN NOT NULL DEFAULT false,
  notify_daily_digest BOOLEAN NOT NULL DEFAULT false,
  daily_digest_time TIME DEFAULT '09:00',

  -- ==========================================
  -- OUTLOOK CALENDAR SYNC
  -- ==========================================
  outlook_create_events BOOLEAN NOT NULL DEFAULT true,
  outlook_calendar_name TEXT DEFAULT 'Parking',
  outlook_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  outlook_sync_interval INTEGER DEFAULT 15 CHECK (outlook_sync_interval >= 5), -- minutes

  -- ==========================================
  -- AUTO-CESSION RULES (Management only)
  -- ==========================================
  auto_cede_on_ooo BOOLEAN NOT NULL DEFAULT true, -- Auto-cede when Out of Office
  auto_cede_notify BOOLEAN NOT NULL DEFAULT true, -- Notify when auto-cession happens
  auto_cede_days INTEGER[] DEFAULT '{}', -- [0,5,6] = Sunday, Friday, Saturday

  -- ==========================================
  -- PARKING PREFERENCES
  -- ==========================================
  default_view TEXT NOT NULL DEFAULT 'map'
    CHECK (default_view IN ('map', 'list', 'calendar')),
  favorite_spot_ids UUID[] DEFAULT '{}',
  usual_arrival_time TIME DEFAULT '09:00',

  -- ==========================================
  -- APPEARANCE
  -- ==========================================
  theme TEXT NOT NULL DEFAULT 'system'
    CHECK (theme IN ('light', 'dark', 'system')),
  locale TEXT NOT NULL DEFAULT 'es'
    CHECK (locale IN ('es', 'en')),

  -- ==========================================
  -- METADATA
  -- ==========================================
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE TRIGGER set_updated_at_user_preferences
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- TABLE: user_microsoft_tokens
-- =====================================================
-- Stores OAuth tokens and metadata for Microsoft 365 integration

CREATE TABLE user_microsoft_tokens (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- ==========================================
  -- OAUTH TOKENS
  -- ==========================================
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',

  -- ==========================================
  -- TEAMS INTEGRATION
  -- ==========================================
  teams_tenant_id TEXT,
  teams_user_id TEXT, -- Microsoft Teams user ID for sending notifications
  teams_conversation_id TEXT, -- Bot conversation ID for DMs

  -- ==========================================
  -- OUTLOOK INTEGRATION
  -- ==========================================
  outlook_calendar_id TEXT, -- ID of the "Parking" calendar
  last_calendar_sync_at TIMESTAMPTZ,
  last_ooo_check_at TIMESTAMPTZ,
  current_ooo_status BOOLEAN NOT NULL DEFAULT false,
  current_ooo_until TIMESTAMPTZ,

  -- ==========================================
  -- METADATA
  -- ==========================================
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE TRIGGER set_updated_at_user_microsoft_tokens
  BEFORE UPDATE ON user_microsoft_tokens
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- FUNCTION: Create default preferences for new users
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-create preferences on user signup
-- =====================================================

CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_preferences();

-- =====================================================
-- SEED: Create preferences for existing users
-- =====================================================

INSERT INTO user_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_microsoft_tokens ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- user_preferences policies
-- ==========================================

-- Users can read their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY "Admins can view all preferences"
  ON user_preferences
  FOR SELECT
  USING (is_admin());

-- Admins can update all preferences
CREATE POLICY "Admins can update all preferences"
  ON user_preferences
  FOR UPDATE
  USING (is_admin());

-- ==========================================
-- user_microsoft_tokens policies
-- ==========================================

-- Users can read their own tokens
CREATE POLICY "Users can view own tokens"
  ON user_microsoft_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens (after OAuth)
CREATE POLICY "Users can insert own tokens"
  ON user_microsoft_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens (refresh)
CREATE POLICY "Users can update own tokens"
  ON user_microsoft_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens (disconnect)
CREATE POLICY "Users can delete own tokens"
  ON user_microsoft_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all tokens (for debugging)
CREATE POLICY "Admins can view all tokens"
  ON user_microsoft_tokens
  FOR SELECT
  USING (is_admin());

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_preferences IS 'User-specific settings for notifications, parking preferences, and UI customization';
COMMENT ON TABLE user_microsoft_tokens IS 'OAuth tokens and metadata for Microsoft 365 integration (Teams bot + Outlook sync)';

COMMENT ON COLUMN user_preferences.notification_channel IS 'Preferred notification channel: teams (bot), email, or both';
COMMENT ON COLUMN user_preferences.auto_cede_on_ooo IS 'Auto-cede management spot when Outlook detects Out of Office status';
COMMENT ON COLUMN user_preferences.auto_cede_days IS 'Days of week to auto-cede (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN user_preferences.favorite_spot_ids IS 'Prioritized spots for alerts and recommendations';

COMMENT ON COLUMN user_microsoft_tokens.teams_user_id IS 'Microsoft Teams user ID for sending bot notifications';
COMMENT ON COLUMN user_microsoft_tokens.current_ooo_status IS 'Current Out of Office status from Outlook (updated hourly by cron)';

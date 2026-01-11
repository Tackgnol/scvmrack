-- Migration: Create guest_sessions table
-- This stores anonymous sessions for guests (not tied to Better Auth)

CREATE TABLE IF NOT EXISTS guest_sessions
(
    id
    UUID
    PRIMARY
    KEY,
    expires_at
    TIMESTAMP
    WITH
    TIME
    ZONE
    NOT
    NULL,
    created_at
    TIMESTAMP
    WITH
    TIME
    ZONE
    DEFAULT
    NOW
(
),
    ip_address TEXT,
    user_agent TEXT
    );

-- Index for cleanup job
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires_at ON guest_sessions(expires_at);

-- Add session_id column to characters if not exists
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS session_id TEXT,
    ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_characters_session_id ON characters(session_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

COMMENT
ON TABLE guest_sessions IS 'Anonymous sessions for guest users (separate from Better Auth)';
COMMENT
ON COLUMN characters.session_id IS 'Guest session that created this character';
COMMENT
ON COLUMN characters.user_id IS 'User who owns this character (NULL for unclaimed guests)';

-- ObrAuthHandoff table was a 2-minute-TTL ephemeral mailbox for OBR auth handoff.
-- Token exchange now lives in shared-auth's verification table. Safe to drop.
DROP TABLE IF EXISTS "obr_auth_handoffs";

-- ONE-TIME MIGRATION: Fix production drift
-- Run on production (mydevil.net) via PhpPgAdmin
--
-- What it does:
--   1. Drops the stale get_character_full(uuid, varchar) overload
--      that was never cleaned up when migration 013 introduced the (uuid, text) version
--
-- Safe to run: the varchar overload is identical to the text one but older (no tags/dice).
-- Your backend calls this with TEXT parameters, so it already uses the correct overload.

DROP FUNCTION IF EXISTS get_character_full(uuid, character varying);

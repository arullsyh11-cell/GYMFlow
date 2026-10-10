# Changelog

## Final hardening audit
- Added `liveSync.js` with Supabase Postgres Changes listener and authenticated `gymflow_get_state` polling fallback.
- Added a dashboard bridge to apply remote data without a page reload, while deferring application if local save activity or user editing is detected.
- Added a save-completion event to retry deferred synchronization checks.
- Escaped routine/session IDs and history date strings inserted into HTML templates.
- Added `tests/live-sync-smoke.mjs`, `tests/hardening-static-checks.py`, and read-only `supabase-verification.sql`.
- Clarified that the SQL source checks are skipped when migration files are not packaged; a skipped SQL-source check is not a database verification pass.

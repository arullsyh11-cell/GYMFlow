-- Read-only checks for the Stage D import RPC. Run in Supabase SQL Editor after applying the Stage D migration.
-- This validates function registration and EXECUTE grants; it does not simulate a signed-in browser session.
-- The log query is administrative: SQL Editor usually has elevated rights and auth.uid() may be NULL.

select
  pg_catalog.to_regprocedure('public.gymflow_import_legacy_payload(text,text,integer,text,jsonb)') is not null
    as import_function_exists,
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.gymflow_import_legacy_payload(text,text,integer,text,jsonb)',
    'EXECUTE'
  ) as authenticated_can_execute,
  pg_catalog.has_function_privilege(
    'anon',
    'public.gymflow_import_legacy_payload(text,text,integer,text,jsonb)',
    'EXECUTE'
  ) as anon_can_execute;

select
  status,
  source_key,
  source_schema_version,
  source_counts,
  imported_counts,
  source_fingerprint,
  started_at,
  finished_at,
  last_error
from public.migration_logs
order by started_at desc
limit 10;

-- GYMFlow final audit: READ-ONLY verification queries.
-- Run each query in Supabase SQL Editor. These statements do not alter data or schema.

-- 1) List public tables and whether row-level security is enabled/forced.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- 2) Inspect every public RLS policy, including USING and WITH CHECK expressions.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Verify RPC security mode and whether anon/authenticated roles can execute key functions.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'gymflow_get_state',
    'gymflow_save_state',
    'gymflow_import_legacy_payload'
  )
order by p.proname, pg_get_function_identity_arguments(p.oid);

-- 4) Show which public tables are currently included in the Supabase Realtime publication.
-- Realtime events are optional because liveSync.js also has an authenticated RPC polling fallback.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;

-- 5) Optional: inspect the security-related definition of the core save/get RPCs.
-- Review for auth.uid() checks and avoid exposing another user's rows.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('gymflow_get_state', 'gymflow_save_state', 'gymflow_import_legacy_payload')
order by p.proname, pg_get_function_identity_arguments(p.oid);

-- GYMFlow Stage D: atomic, owner-scoped import of legacy LocalStorage state.
-- Requires the Stage B schema to be applied first.
-- Run once in the Supabase SQL Editor. Do not run in the browser.

begin;

create or replace function public.gymflow_import_legacy_payload(
  p_migration_key text,
  p_source_key text,
  p_source_schema_version integer,
  p_source_fingerprint text,
  p_payload jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_status text;
  v_existing_counts jsonb;
  v_settings jsonb;
  v_exercises jsonb;
  v_routines jsonb;
  v_history jsonb;
  v_weights jsonb;
  v_active jsonb;
  v_sessions jsonb := '[]'::jsonb;
  v_item jsonb;
  v_routine jsonb;
  v_routine_exercise jsonb;
  v_session jsonb;
  v_session_exercise jsonb;
  v_set jsonb;
  v_ord bigint;
  v_routine_ex_ord bigint;
  v_session_ord bigint;
  v_session_ex_ord bigint;
  v_set_ord bigint;
  v_legacy_id text;
  v_legacy_exercise_id text;
  v_routine_legacy_id text;
  v_session_legacy_id text;
  v_routine_id uuid;
  v_session_id uuid;
  v_session_exercise_id uuid;
  v_exercise_id uuid;
  v_display_name text;
  v_age smallint;
  v_height numeric(7,2);
  v_weight numeric(8,3);
  v_height_unit text;
  v_weight_unit text;
  v_theme text;
  v_language text;
  v_rest_seconds integer;
  v_weekly_goal smallint;
  v_days text[];
  v_routine_exercises jsonb;
  v_default_sets jsonb;
  v_exercise_name text;
  v_muscle text;
  v_equipment text;
  v_metric_type text;
  v_started_at timestamptz;
  v_ended_at timestamptz;
  v_duration integer;
  v_paused_seconds integer;
  v_rest_remaining integer;
  v_rest_paused boolean;
  v_current_exercise_index integer;
  v_calories integer;
  v_status text;
  v_reps numeric(9,2);
  v_weight_kg numeric(10,3);
  v_duration_minutes numeric(10,3);
  v_distance_km numeric(10,3);
  v_completed_at timestamptz;
  v_record_date date;
  v_record_weight numeric(8,3);
  v_inserted integer := 0;
  v_custom_count integer := 0;
  v_routine_count integer := 0;
  v_routine_exercise_count integer := 0;
  v_completed_session_count integer := 0;
  v_active_session_count integer := 0;
  v_session_exercise_count integer := 0;
  v_set_count integer := 0;
  v_weight_count integer := 0;
  v_row_count integer := 0;
  v_source_counts jsonb;
  v_imported_counts jsonb;
  v_error text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Login diperlukan untuk mengimpor progress.';
  end if;
  if p_migration_key is null or pg_catalog.length(pg_catalog.btrim(p_migration_key)) not between 1 and 160 then
    raise exception using errcode = '22023', message = 'Migration key tidak valid.';
  end if;
  if p_source_key is null or p_source_key not in ('gymflow-v3', 'gymflow-v2', 'gymflow-v1') then
    raise exception using errcode = '22023', message = 'Versi sumber LocalStorage tidak didukung.';
  end if;
  if p_source_schema_version not between 1 and 3 then
    raise exception using errcode = '22023', message = 'Versi schema sumber tidak didukung.';
  end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'Payload impor harus berupa objek JSON.';
  end if;

  if p_payload ? 'settings' and pg_catalog.jsonb_typeof(p_payload->'settings') not in ('object', 'null') then
    raise exception using errcode = '22023', message = 'Bagian settings bukan objek yang valid.';
  end if;
  if p_payload ? 'exercises' and pg_catalog.jsonb_typeof(p_payload->'exercises') <> 'array' then
    raise exception using errcode = '22023', message = 'Daftar exercises bukan array yang valid.';
  end if;
  if p_payload ? 'routines' and pg_catalog.jsonb_typeof(p_payload->'routines') <> 'array' then
    raise exception using errcode = '22023', message = 'Daftar routines bukan array yang valid.';
  end if;
  if p_payload ? 'history' and pg_catalog.jsonb_typeof(p_payload->'history') <> 'array' then
    raise exception using errcode = '22023', message = 'Daftar history bukan array yang valid.';
  end if;
  if p_payload ? 'weightHistory' and pg_catalog.jsonb_typeof(p_payload->'weightHistory') <> 'array' then
    raise exception using errcode = '22023', message = 'Daftar weight history bukan array yang valid.';
  end if;
  if p_payload ? 'activeSession' and pg_catalog.jsonb_typeof(p_payload->'activeSession') not in ('object', 'null') then
    raise exception using errcode = '22023', message = 'Sesi aktif bukan objek yang valid.';
  end if;

  v_settings := case when pg_catalog.jsonb_typeof(p_payload->'settings') = 'object' then p_payload->'settings' else '{}'::jsonb end;
  v_exercises := coalesce(p_payload->'exercises', '[]'::jsonb);
  v_routines := coalesce(p_payload->'routines', '[]'::jsonb);
  v_history := coalesce(p_payload->'history', '[]'::jsonb);
  v_weights := coalesce(p_payload->'weightHistory', '[]'::jsonb);
  v_active := p_payload->'activeSession';

  v_display_name := coalesce(nullif(pg_catalog.btrim(v_settings->>'userName'), ''), 'GYMFlow User');
  v_theme := coalesce(v_settings->>'theme', 'dark');
  v_language := coalesce(v_settings->>'language', 'id');
  v_height_unit := coalesce(v_settings->>'heightUnit', 'cm');
  v_weight_unit := coalesce(v_settings->>'weightUnit', 'kg');
  v_rest_seconds := coalesce(nullif(v_settings->>'restSeconds', '')::integer, 90);
  v_weekly_goal := coalesce(nullif(v_settings->>'weeklyGoal', '')::smallint, 4);
  v_age := nullif(v_settings->>'age', '')::smallint;
  v_height := nullif(v_settings->>'height', '')::numeric;
  v_weight := nullif(v_settings->>'weight', '')::numeric;

  if pg_catalog.length(v_display_name) > 80 then
    raise exception using errcode = '22023', message = 'Nama profil melebihi batas 80 karakter.';
  end if;
  if v_theme not in ('dark', 'light') or v_language not in ('id', 'en') then
    raise exception using errcode = '22023', message = 'Preferensi tema atau bahasa tidak valid.';
  end if;
  if v_height_unit not in ('cm', 'ft') or v_weight_unit not in ('kg', 'lbs') then
    raise exception using errcode = '22023', message = 'Satuan tinggi atau berat tidak valid.';
  end if;
  if v_rest_seconds not between 0 and 3600 or v_weekly_goal not between 0 and 14 then
    raise exception using errcode = '22023', message = 'Target mingguan atau waktu istirahat di luar batas.';
  end if;
  if v_age is not null and v_age not between 0 and 120 then
    raise exception using errcode = '22023', message = 'Usia profil di luar batas.';
  end if;
  if v_height is not null and not (v_height > 0 and v_height < 300) then
    raise exception using errcode = '22023', message = 'Nilai tinggi profil di luar batas.';
  end if;
  if v_weight is not null and not (v_weight > 0 and v_weight < 1000) then
    raise exception using errcode = '22023', message = 'Nilai berat profil di luar batas.';
  end if;

  select pg_catalog.jsonb_build_object(
    'exercise_entries', pg_catalog.jsonb_array_length(v_exercises),
    'custom_exercises', coalesce((
      select pg_catalog.count(*) from pg_catalog.jsonb_array_elements(v_exercises) as x(value)
      where coalesce((x.value->>'isCustom')::boolean, false)
    ), 0),
    'routines', pg_catalog.jsonb_array_length(v_routines),
    'completed_sessions', pg_catalog.jsonb_array_length(v_history),
    'active_sessions', case when pg_catalog.jsonb_typeof(v_active) = 'object' then 1 else 0 end,
    'weight_records', pg_catalog.jsonb_array_length(v_weights)
  ) into v_source_counts;

  -- Serialise simultaneous requests for the same account and migration key.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_migration_key, 0)
  );

  select ml.status, ml.imported_counts
    into v_existing_status, v_existing_counts
  from public.migration_logs as ml
  where ml.user_id = v_user_id and ml.migration_key = p_migration_key
  for update;

  if found and v_existing_status = 'completed' then
    return pg_catalog.jsonb_build_object(
      'status', 'completed',
      'already_completed', true,
      'source_counts', v_source_counts,
      'imported_counts', coalesce(v_existing_counts, '{}'::jsonb)
    );
  end if;

  insert into public.migration_logs (
    user_id, migration_key, source_key, source_schema_version, status,
    source_counts, imported_counts, failed_items, source_fingerprint,
    last_error, started_at, finished_at
  ) values (
    v_user_id, p_migration_key, p_source_key, p_source_schema_version, 'started',
    v_source_counts, '{}'::jsonb, '[]'::jsonb, p_source_fingerprint,
    null, pg_catalog.now(), null
  )
  on conflict (user_id, migration_key) do update set
    source_key = excluded.source_key,
    source_schema_version = excluded.source_schema_version,
    status = 'started',
    source_counts = excluded.source_counts,
    imported_counts = '{}'::jsonb,
    failed_items = '[]'::jsonb,
    source_fingerprint = excluded.source_fingerprint,
    last_error = null,
    started_at = pg_catalog.now(),
    finished_at = null;

  -- Every write is in this subtransaction. If any row fails validation, all
  -- imported data rolls back, and the failure status is recorded below.
  begin
    -- A new import may populate the profile/settings defaults created by Auth,
    -- but never silently merge into or overwrite an account with workout data.
    if exists (select 1 from public.exercises e where e.owner_id = v_user_id)
       or exists (select 1 from public.routines r where r.user_id = v_user_id)
       or exists (select 1 from public.workout_sessions s where s.user_id = v_user_id)
       or exists (select 1 from public.weight_records w where w.user_id = v_user_id) then
      raise exception using errcode = 'P0001', message = 'ACCOUNT_NOT_EMPTY: akun ini sudah memiliki data latihan di server. Impor otomatis dibatalkan agar tidak menimpa atau mencampur data.';
    end if;

    update public.profiles
       set display_name = v_display_name,
           age = v_age,
           height_value = v_height,
           weight_value = v_weight
     where user_id = v_user_id;
    if not found then
      insert into public.profiles (user_id, display_name, age, height_value, weight_value)
      values (v_user_id, v_display_name, v_age, v_height, v_weight);
    end if;

    update public.user_settings
       set theme = v_theme,
           rest_seconds = v_rest_seconds,
           weekly_goal = v_weekly_goal,
           language = v_language,
           height_unit = v_height_unit,
           weight_unit = v_weight_unit
     where user_id = v_user_id;
    if not found then
      insert into public.user_settings (
        user_id, theme, rest_seconds, weekly_goal, language, height_unit, weight_unit
      ) values (
        v_user_id, v_theme, v_rest_seconds, v_weekly_goal, v_language, v_height_unit, v_weight_unit
      );
    end if;

    -- Import custom exercises only. Built-in exercises are already seeded in
    -- Stage B and are mapped by their legacy_id.
    for v_item, v_ord in
      select value, ordinality from pg_catalog.jsonb_array_elements(v_exercises) with ordinality
    loop
      if coalesce((v_item->>'isCustom')::boolean, false) then
        v_legacy_id := coalesce(nullif(pg_catalog.btrim(v_item->>'id'), ''), 'legacy-custom-' || v_ord::text);
        insert into public.exercises (
          owner_id, legacy_id, name, muscle, equipment, is_builtin, legacy_payload
        ) values (
          v_user_id,
          v_legacy_id,
          pg_catalog.btrim(v_item->>'name'),
          v_item->>'muscle',
          coalesce(nullif(pg_catalog.btrim(v_item->>'equipment'), ''), 'Bodyweight'),
          false,
          v_item
        ) returning id into v_exercise_id;
        v_custom_count := v_custom_count + 1;
      end if;
    end loop;

    -- Import routines first so both saved routines and active/history sessions
    -- can resolve routine_id. Preserve order via sort_order and exercise list.
    for v_routine, v_ord in
      select value, ordinality from pg_catalog.jsonb_array_elements(v_routines) with ordinality
    loop
      v_legacy_id := coalesce(nullif(pg_catalog.btrim(v_routine->>'id'), ''), 'legacy-routine-' || v_ord::text);
      v_days := coalesce((
        select pg_catalog.array_agg(day_value order by day_ord)
        from pg_catalog.jsonb_array_elements_text(coalesce(v_routine->'days', '[]'::jsonb)) with ordinality as d(day_value, day_ord)
      ), '{}'::text[]);

      insert into public.routines (
        user_id, legacy_id, name, description, days, sort_order, legacy_payload
      ) values (
        v_user_id,
        v_legacy_id,
        pg_catalog.btrim(v_routine->>'name'),
        coalesce(v_routine->>'description', ''),
        v_days,
        (v_ord - 1)::integer,
        v_routine
      ) returning id into v_routine_id;
      v_routine_count := v_routine_count + 1;

      v_routine_exercises := case
        when pg_catalog.jsonb_typeof(v_routine->'exercises') = 'array' then v_routine->'exercises'
        else '[]'::jsonb
      end;

      -- Older schema revisions stored only exerciseIds; reconstruct the default
      -- sets using canonical database muscle categories.
      if pg_catalog.jsonb_array_length(v_routine_exercises) = 0 then
        for v_legacy_exercise_id in
          select value from pg_catalog.jsonb_array_elements_text(coalesce(v_routine->'exerciseIds', '[]'::jsonb))
        loop
          select e.muscle into v_muscle
          from public.exercises e
          where e.legacy_id = v_legacy_exercise_id
            and (e.owner_id is null or e.owner_id = v_user_id)
          order by (e.owner_id = v_user_id) desc nulls last
          limit 1;
          if v_muscle = 'Cardio' then
            v_default_sets := '[{"reps":15,"weight":2}]'::jsonb;
          else
            v_default_sets := '[{"reps":10,"weight":0},{"reps":10,"weight":0},{"reps":10,"weight":0}]'::jsonb;
          end if;
          v_routine_exercises := v_routine_exercises || pg_catalog.jsonb_build_array(
            pg_catalog.jsonb_build_object('id', v_legacy_exercise_id, 'sets', v_default_sets)
          );
        end loop;
      end if;

      for v_routine_exercise, v_routine_ex_ord in
        select value, ordinality from pg_catalog.jsonb_array_elements(v_routine_exercises) with ordinality
      loop
        v_legacy_exercise_id := coalesce(nullif(v_routine_exercise->>'id', ''), nullif(v_routine_exercise->>'exerciseId', ''));
        v_exercise_id := null;
        v_exercise_name := null;
        v_muscle := null;
        v_equipment := null;
        if v_legacy_exercise_id is not null then
          select e.id, e.name, e.muscle, e.equipment
            into v_exercise_id, v_exercise_name, v_muscle, v_equipment
          from public.exercises e
          where e.legacy_id = v_legacy_exercise_id
            and (e.owner_id is null or e.owner_id = v_user_id)
          order by (e.owner_id = v_user_id) desc nulls last
          limit 1;
        end if;
        if v_exercise_name is null then
          select x.value->>'name', x.value->>'muscle', x.value->>'equipment'
            into v_exercise_name, v_muscle, v_equipment
          from pg_catalog.jsonb_array_elements(v_exercises) as x(value)
          where x.value->>'id' = v_legacy_exercise_id
          limit 1;
        end if;
        v_exercise_name := coalesce(nullif(pg_catalog.btrim(v_exercise_name), ''), pg_catalog.left('Exercise ' || coalesce(v_legacy_exercise_id, 'unknown'), 120));
        v_muscle := case when v_muscle in ('Cardio', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core') then v_muscle else null end;
        v_equipment := case when v_equipment is not null and pg_catalog.length(pg_catalog.btrim(v_equipment)) between 1 and 80 then v_equipment else null end;

        insert into public.routine_exercises (
          user_id, routine_id, legacy_id, exercise_id, legacy_exercise_id,
          exercise_name_snapshot, muscle_snapshot, equipment_snapshot,
          sort_order, default_sets, legacy_payload
        ) values (
          v_user_id,
          v_routine_id,
          'routine-exercise:' || v_routine_ex_ord::text,
          v_exercise_id,
          v_legacy_exercise_id,
          v_exercise_name,
          v_muscle,
          v_equipment,
          (v_routine_ex_ord - 1)::integer,
          case when pg_catalog.jsonb_typeof(v_routine_exercise->'sets') = 'array' then v_routine_exercise->'sets' else '[]'::jsonb end,
          v_routine_exercise
        );
        v_routine_exercise_count := v_routine_exercise_count + 1;
      end loop;
    end loop;

    -- Tag history as completed and preserve activeSession separately.
    select coalesce(
      pg_catalog.jsonb_agg(value || pg_catalog.jsonb_build_object('__gymflow_import_status', 'completed') order by ordinality),
      '[]'::jsonb
    ) into v_sessions
    from pg_catalog.jsonb_array_elements(v_history) with ordinality as h(value, ordinality);

    if pg_catalog.jsonb_typeof(v_active) = 'object' then
      v_sessions := v_sessions || pg_catalog.jsonb_build_array(
        v_active || pg_catalog.jsonb_build_object('__gymflow_import_status', 'active')
      );
    end if;

    for v_session, v_session_ord in
      select value, ordinality from pg_catalog.jsonb_array_elements(v_sessions) with ordinality
    loop
      v_status := v_session->>'__gymflow_import_status';
      v_session_legacy_id := coalesce(nullif(pg_catalog.btrim(v_session->>'id'), ''), 'legacy-session-' || v_session_ord::text);
      v_routine_legacy_id := nullif(pg_catalog.btrim(v_session->>'routineId'), '');
      v_routine_id := null;
      v_exercise_name := null;
      if v_routine_legacy_id is not null then
        select r.id, r.name into v_routine_id, v_exercise_name
        from public.routines r
        where r.user_id = v_user_id and r.legacy_id = v_routine_legacy_id;
      end if;
      v_started_at := nullif(v_session->>'startedAt', '')::timestamptz;
      v_ended_at := nullif(v_session->>'endedAt', '')::timestamptz;
      v_paused_seconds := greatest(0, coalesce(nullif(v_session->>'pausedSeconds', '')::integer, 0));
      v_current_exercise_index := greatest(0, coalesce(nullif(v_session->>'currentExerciseIndex', '')::integer, 0));
      v_rest_remaining := case when nullif(v_session->>'restRemaining', '') is null then null else greatest(0, (v_session->>'restRemaining')::integer) end;
      v_rest_paused := coalesce((v_session->>'restPaused')::boolean, false);
      v_calories := greatest(0, coalesce(nullif(v_session->>'caloriesBurned', '')::integer, 0));
      if v_status = 'active' and v_started_at is not null then
        v_duration := greatest(0, extract(epoch from (pg_catalog.now() - v_started_at))::integer - v_paused_seconds);
      else
        v_duration := greatest(0, coalesce(nullif(v_session->>'duration', '')::numeric, 0)::integer);
      end if;

      insert into public.workout_sessions (
        user_id, legacy_id, routine_id, routine_legacy_id, routine_name_snapshot,
        status, started_at, ended_at, duration_seconds, paused_seconds,
        current_exercise_index, rest_remaining, rest_paused, calories_burned,
        stats, legacy_payload
      ) values (
        v_user_id,
        v_session_legacy_id,
        v_routine_id,
        v_routine_legacy_id,
        coalesce(nullif(v_exercise_name, ''), nullif(v_session->>'routineName', ''), 'Workout'),
        case when v_status = 'active' then 'active' else 'completed' end,
        v_started_at,
        v_ended_at,
        v_duration,
        v_paused_seconds,
        v_current_exercise_index,
        v_rest_remaining,
        v_rest_paused,
        v_calories,
        case when pg_catalog.jsonb_typeof(v_session->'stats') = 'object' then v_session->'stats' else '{}'::jsonb end,
        v_session - '__gymflow_import_status'
      ) returning id into v_session_id;

      if v_status = 'active' then
        v_active_session_count := v_active_session_count + 1;
      else
        v_completed_session_count := v_completed_session_count + 1;
      end if;

      if v_session ? 'exercises' and pg_catalog.jsonb_typeof(v_session->'exercises') <> 'array' then
        raise exception using errcode = '22023', message = 'Daftar exercise pada salah satu sesi tidak valid.';
      end if;
      for v_session_exercise, v_session_ex_ord in
        select value, ordinality
        from pg_catalog.jsonb_array_elements(coalesce(v_session->'exercises', '[]'::jsonb)) with ordinality
      loop
        v_legacy_exercise_id := coalesce(nullif(v_session_exercise->>'exerciseId', ''), nullif(v_session_exercise->>'id', ''));
        v_exercise_id := null;
        v_exercise_name := null;
        v_muscle := null;
        v_equipment := null;
        if v_legacy_exercise_id is not null then
          select e.id, e.name, e.muscle, e.equipment
            into v_exercise_id, v_exercise_name, v_muscle, v_equipment
          from public.exercises e
          where e.legacy_id = v_legacy_exercise_id
            and (e.owner_id is null or e.owner_id = v_user_id)
          order by (e.owner_id = v_user_id) desc nulls last
          limit 1;
        end if;
        if v_exercise_name is null then
          select x.value->>'name', x.value->>'muscle', x.value->>'equipment'
            into v_exercise_name, v_muscle, v_equipment
          from pg_catalog.jsonb_array_elements(v_exercises) as x(value)
          where x.value->>'id' = v_legacy_exercise_id
          limit 1;
        end if;
        v_exercise_name := coalesce(nullif(pg_catalog.btrim(v_exercise_name), ''), pg_catalog.left('Exercise ' || coalesce(v_legacy_exercise_id, 'unknown'), 120));
        v_muscle := case when v_muscle in ('Cardio', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core') then v_muscle else null end;
        v_equipment := case when v_equipment is not null and pg_catalog.length(pg_catalog.btrim(v_equipment)) between 1 and 80 then v_equipment else null end;
        v_metric_type := case when v_muscle = 'Cardio' then 'cardio' else 'strength' end;

        insert into public.session_exercises (
          user_id, workout_session_id, legacy_id, exercise_id, legacy_exercise_id,
          exercise_name_snapshot, muscle_snapshot, equipment_snapshot,
          metric_type, notes, sort_order, legacy_payload
        ) values (
          v_user_id,
          v_session_id,
          'session-exercise:' || v_session_ex_ord::text,
          v_exercise_id,
          v_legacy_exercise_id,
          v_exercise_name,
          v_muscle,
          v_equipment,
          v_metric_type,
          coalesce(v_session_exercise->>'notes', ''),
          (v_session_ex_ord - 1)::integer,
          v_session_exercise
        ) returning id into v_session_exercise_id;
        v_session_exercise_count := v_session_exercise_count + 1;

        if v_session_exercise ? 'sets' and pg_catalog.jsonb_typeof(v_session_exercise->'sets') <> 'array' then
          raise exception using errcode = '22023', message = 'Daftar set pada salah satu exercise tidak valid.';
        end if;
        for v_set, v_set_ord in
          select value, ordinality
          from pg_catalog.jsonb_array_elements(coalesce(v_session_exercise->'sets', '[]'::jsonb)) with ordinality
        loop
          v_reps := nullif(v_set->>'reps', '')::numeric;
          v_weight_kg := nullif(v_set->>'weight', '')::numeric;
          v_completed_at := nullif(v_set->>'completedAt', '')::timestamptz;
          if v_metric_type = 'cardio' then
            v_duration_minutes := v_reps;
            v_distance_km := v_weight_kg;
            v_reps := null;
            v_weight_kg := null;
          else
            v_duration_minutes := null;
            v_distance_km := null;
          end if;
          insert into public.workout_sets (
            user_id, session_exercise_id, legacy_id, set_number,
            reps, weight_kg, duration_minutes, distance_km, completed_at, legacy_payload
          ) values (
            v_user_id,
            v_session_exercise_id,
            'set:' || v_set_ord::text,
            v_set_ord::integer,
            v_reps,
            v_weight_kg,
            v_duration_minutes,
            v_distance_km,
            v_completed_at,
            v_set
          );
          v_set_count := v_set_count + 1;
        end loop;
      end loop;
    end loop;

    -- Legacy weightHistory stores date+numeric value but no per-entry unit.
    -- The current settings.weightUnit is used only after explicit user consent.
    for v_item, v_ord in
      select value, ordinality from pg_catalog.jsonb_array_elements(v_weights) with ordinality
    loop
      v_record_date := (v_item->>'date')::date;
      v_record_weight := (v_item->>'weight')::numeric;
      insert into public.weight_records (
        user_id, legacy_id, record_date, weight_value, weight_unit, legacy_payload
      ) values (
        v_user_id,
        'weight:' || v_record_date::text,
        v_record_date,
        v_record_weight,
        v_weight_unit,
        v_item
      );
      v_weight_count := v_weight_count + 1;
    end loop;
  exception when others then
    v_error := sqlerrm;
    update public.migration_logs
       set status = 'failed',
           imported_counts = '{}'::jsonb,
           failed_items = pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('message', pg_catalog.left(v_error, 1000))),
           last_error = pg_catalog.left(v_error, 1000),
           finished_at = pg_catalog.now()
     where user_id = v_user_id and migration_key = p_migration_key;
    return pg_catalog.jsonb_build_object('status', 'failed', 'message', v_error, 'source_counts', v_source_counts);
  end;

  v_imported_counts := pg_catalog.jsonb_build_object(
    'custom_exercises', v_custom_count,
    'routines', v_routine_count,
    'routine_exercises', v_routine_exercise_count,
    'completed_sessions', v_completed_session_count,
    'active_sessions', v_active_session_count,
    'session_exercises', v_session_exercise_count,
    'workout_sets', v_set_count,
    'weight_records', v_weight_count
  );

  update public.migration_logs
     set status = 'completed',
         source_counts = v_source_counts,
         imported_counts = v_imported_counts,
         failed_items = '[]'::jsonb,
         source_fingerprint = p_source_fingerprint,
         last_error = null,
         finished_at = pg_catalog.now()
   where user_id = v_user_id and migration_key = p_migration_key;

  return pg_catalog.jsonb_build_object(
    'status', 'completed',
    'already_completed', false,
    'source_counts', v_source_counts,
    'imported_counts', v_imported_counts,
    'weight_unit_assumption', v_weight_unit
  );
end;
$$;

revoke all on function public.gymflow_import_legacy_payload(text, text, integer, text, jsonb) from public, anon;
grant execute on function public.gymflow_import_legacy_payload(text, text, integer, text, jsonb) to authenticated;

comment on function public.gymflow_import_legacy_payload(text, text, integer, text, jsonb) is
  'Atomically imports one validated GYMFlow LocalStorage payload for auth.uid(); refuses merge/overwrite if the account already has substantive workout data. LocalStorage must remain until verified by the user.';

commit;

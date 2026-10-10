function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function comparableState(source) {
  if (!source || typeof source !== "object") return source;
  const result = cloneJson(source);
  result.settings = {
    theme: "dark", restSeconds: 90, weight: 65, height: 170, age: 25,
    heightUnit: "cm", weightUnit: "kg", weeklyGoal: 4, userName: "COYY", language: "id",
    ...(result.settings || {})
  };
  result.routines = Array.isArray(result.routines) ? result.routines : [];
  result.history = Array.isArray(result.history) ? result.history : [];
  result.weightHistory = Array.isArray(result.weightHistory) ? result.weightHistory : [];
  if (result.activeSession === undefined) result.activeSession = null;
  const weight = Number(result.settings.weight) || 65;

  // Built-in exercises are shipped with the frontend and may not be stored as user records.
  result.exercises = (Array.isArray(result.exercises) ? result.exercises : [])
    .filter(exercise => exercise?.isCustom === true)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  // Older server records may omit this derived display field. Use the same fallback as script.js.
  for (const session of [...(result.history || []), ...(result.activeSession ? [result.activeSession] : [])]) {
    if (session && session.caloriesBurned === undefined) {
      session.caloriesBurned = Math.round(0.05 * weight * ((Number(session.duration) || 0) / 60));
    }
  }
  return result;
}

function stateIsEqual(a, b) {
  try {
    return stableStringify(comparableState(a)) === stableStringify(comparableState(b));
  } catch {
    return false;
  }
}

/**
 * Keeps the dashboard in sync across sessions/devices.
 * Postgres Changes provides low-latency updates when enabled; authenticated RPC polling
 * is retained as a fallback, so sync still works when Realtime publication is unavailable.
 */
export function startRemoteLiveSync({
  client,
  userId,
  getCurrentUserId,
  getCurrentState,
  canApplyState,
  applyState,
  onStatus = () => {},
  fetchState,
  pollIntervalMs = 12000
}) {
  if (!client || !userId || typeof getCurrentUserId !== "function" ||
      typeof getCurrentState !== "function" || typeof canApplyState !== "function" ||
      typeof applyState !== "function" || typeof fetchState !== "function") {
    throw new Error("Konfigurasi sinkronisasi langsung GYMFlow belum lengkap.");
  }

  let stopped = false;
  let inFlight = false;
  let rerunRequested = false;
  let pendingRemoteChange = false;
  let debounceTimer = null;
  let pollTimer = null;
  let channel = null;

  const safeStatus = (status, message) => {
    try { onStatus(status, message); } catch { /* UI status must not break live sync */ }
  };

  const schedule = (reason, delay = 200) => {
    if (stopped) return;
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      void refresh(reason);
    }, delay);
  };

  async function refresh(reason) {
    if (stopped) return;
    if (getCurrentUserId() !== userId) {
      stop();
      return;
    }
    if (document.visibilityState === "hidden") {
      pendingRemoteChange = true;
      return;
    }
    if (inFlight) {
      rerunRequested = true;
      return;
    }

    inFlight = true;
    try {
      const result = await fetchState();
      if (stopped || getCurrentUserId() !== userId) return;
      const remoteState = result?.state;
      if (!remoteState || typeof remoteState !== "object") {
        throw new Error("Data terbaru dari Supabase tidak valid.");
      }

      const localState = getCurrentState();
      if (stateIsEqual(remoteState, localState)) {
        pendingRemoteChange = false;
        return;
      }

      if (!canApplyState()) {
        // Never replace an in-progress local edit or form. Re-check after save/focus/poll.
        pendingRemoteChange = true;
        return;
      }

      await applyState(remoteState);
      pendingRemoteChange = false;
      safeStatus("ready", reason === "realtime"
        ? "Progress terbaru diterima dari Supabase Realtime."
        : "Progress disinkronkan dari Supabase.");
    } catch (error) {
      if (!stopped) safeStatus("error", `Sinkronisasi gagal: ${error?.message || "periksa koneksi"}`);
    } finally {
      inFlight = false;
      if (rerunRequested && !stopped) {
        rerunRequested = false;
        schedule(pendingRemoteChange ? "pending" : "queued", 300);
      }
    }
  }

  const onVisibilityChange = () => {
    if (document.visibilityState !== "hidden") schedule("resume", 0);
  };
  const onFocus = () => schedule("focus", 0);
  const onOnline = () => schedule("online", 0);
  const onSaveComplete = () => {
    if (pendingRemoteChange) schedule("after-save", 350);
  };

  try {
    channel = client
      .channel(`gymflow-live-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public" }, () => schedule("realtime", 180))
      .subscribe(status => {
        if (stopped) return;
        if (status === "SUBSCRIBED") {
          safeStatus("ready", "Sinkronisasi Realtime aktif; pemeriksaan berkala tetap tersedia.");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          safeStatus("ready", "Realtime belum tersedia; sinkronisasi berkala tetap aktif.");
        }
      });
  } catch {
    safeStatus("ready", "Realtime belum tersedia; sinkronisasi berkala tetap aktif.");
  }

  pollTimer = window.setInterval(() => {
    if (document.visibilityState !== "hidden") schedule(pendingRemoteChange ? "pending" : "poll", 0);
  }, Math.max(5000, pollIntervalMs));

  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onOnline);
  window.addEventListener("gymflow:remote-save-complete", onSaveComplete);
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Catch a change that happened while the user was away before waiting for the first interval.
  schedule("initial", 0);

  function stop() {
    if (stopped) return;
    stopped = true;
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    if (pollTimer !== null) window.clearInterval(pollTimer);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("gymflow:remote-save-complete", onSaveComplete);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (channel) {
      try { void client.removeChannel(channel); } catch { /* session is already ending */ }
      channel = null;
    }
  }

  return stop;
}

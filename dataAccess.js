import { supabase } from "./supabaseClient.js";

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function loadRemoteState() {
  const { data, error } = await supabase.rpc("gymflow_get_state");
  if (error) {
    throw new Error(`Gagal memuat data GYMFlow dari Supabase: ${error.message}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Respons database GYMFlow tidak valid.");
  }
  const { _meta: meta = {}, ...state } = data;
  if (
    !state.settings ||
    !Array.isArray(state.exercises) ||
    !Array.isArray(state.routines) ||
    !Array.isArray(state.history) ||
    !Array.isArray(state.weightHistory) ||
    !(state.activeSession === null || (typeof state.activeSession === "object" && !Array.isArray(state.activeSession)))
  ) {
    throw new Error("Struktur data dari database belum lengkap. Periksa migration Tahap E dan Tahap B.");
  }
  return { state, meta };
}

export function createRemoteSaveQueue(client, expectedUserId, onStatus = () => {}) {
  let debounceTimer = null;
  let maxWaitTimer = null;
  let isFlushing = false;
  let currentFlushPromise = null;
  let revision = 0;
  let persistedRevision = 0;
  let latestSnapshot = null;
  let waiters = [];
  let lastError = null;

  const status = (state, message = "") => {
    try { onStatus(state, message); } catch { /* visual indicator must never break persistence */ }
  };

  const clearTimers = () => {
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    if (maxWaitTimer !== null) window.clearTimeout(maxWaitTimer);
    debounceTimer = null;
    maxWaitTimer = null;
  };

  function schedule(delay = 650) {
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => { void flush(); }, delay);
    if (maxWaitTimer === null) {
      maxWaitTimer = window.setTimeout(() => { void flush(); }, 2500);
    }
  }

  async function flush() {
    if (currentFlushPromise) {
      await currentFlushPromise;
      // A caller such as logout must wait for the newest queued revision, not only the
      // request that happened to be running when flush() was first called.
      if (persistedRevision < revision && !lastError) return flush();
      return;
    }
    if (persistedRevision === revision || !latestSnapshot) return;
    clearTimers();
    isFlushing = true;
    const targetRevision = revision;
    const snapshot = cloneJson(latestSnapshot);

    currentFlushPromise = (async () => {
      status("saving", "Menyimpan perubahan ke Supabase…");
      try {
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        const session = sessionData?.session;
        if (!session || session.user?.id !== expectedUserId) {
          throw new Error("Session akun berubah atau berakhir. Masuk kembali sebelum menyimpan progress.");
        }

        const { data, error } = await client.rpc("gymflow_save_state", { p_state: snapshot });
        if (error) throw error;
        if (!data || data.status !== "saved") {
          throw new Error("Server belum mengonfirmasi penyimpanan GYMFlow.");
        }

        persistedRevision = targetRevision;
        lastError = null;
        const done = waiters.filter(item => item.revision <= targetRevision);
        waiters = waiters.filter(item => item.revision > targetRevision);
        done.forEach(item => item.resolve(data));
        status(persistedRevision === revision ? "saved" : "saving", persistedRevision === revision ? "Semua perubahan sudah tersimpan" : "Menyimpan perubahan terbaru…");
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const failed = waiters.filter(item => item.revision <= targetRevision);
        waiters = waiters.filter(item => item.revision > targetRevision);
        failed.forEach(item => item.reject(lastError));
        status("error", `Gagal menyimpan: ${lastError.message}`);
      } finally {
        isFlushing = false;
        currentFlushPromise = null;
        if (revision > targetRevision) {
          // If a newer edit arrived while the request was running, persist the newest snapshot next.
          schedule(lastError ? 1500 : 350);
        }
      }
    })();

    await currentFlushPromise;
    if (persistedRevision < revision && !lastError) return flush();
  }

  function save(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return Promise.reject(new Error("State GYMFlow untuk disimpan tidak valid."));
    }
    latestSnapshot = cloneJson(snapshot);
    lastError = null;
    revision += 1;
    const thisRevision = revision;
    status("saving", "Menunggu penyimpanan ke Supabase…");
    const promise = new Promise((resolve, reject) => waiters.push({ revision: thisRevision, resolve, reject }));
    // save() is called from existing synchronous UI handlers. Attach a handler so a caller that
    // intentionally does not await it cannot create an unhandled rejection; toast() also observes it.
    promise.catch(() => {});
    schedule();
    return promise;
  }

  save.flush = async () => {
    clearTimers();
    await flush();
    if (persistedRevision < revision) {
      throw lastError || new Error("Perubahan terbaru belum dikonfirmasi tersimpan oleh Supabase.");
    }
  };
  save.getStatus = () => ({ revision, persistedRevision, isFlushing, lastError: lastError?.message || null });
  return save;
}

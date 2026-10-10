import { supabase } from "./supabaseClient.js";
import { loadRemoteState, createRemoteSaveQueue } from "./dataAccess.js";
import { startRemoteLiveSync } from "./liveSync.js";

const appShell = document.querySelector(".app-shell");
if (appShell) {
  appShell.setAttribute("inert", "");
  appShell.setAttribute("aria-hidden", "true");
}
document.body.classList.add("gf-auth-only");

const gate = document.createElement("main");
gate.id = "gf-auth-gate";
gate.className = "gf-auth-gate";
gate.setAttribute("aria-live", "polite");
gate.innerHTML = `
  <section class="gf-auth-card" aria-labelledby="gf-auth-title">
    <div class="gf-auth-brand">
      <div class="gf-auth-mark" aria-hidden="true">GF</div>
      <div>
        <p class="gf-auth-eyebrow">YOUR FITNESS JOURNEY</p>
        <h1 id="gf-auth-title">GYM<span>Flow</span></h1>
      </div>
    </div>
    <div id="gf-auth-content"></div>
    <p class="gf-auth-footnote">YOUR FITNESS JOURNEY</p>
  </section>
`;
document.body.appendChild(gate);

const content = gate.querySelector("#gf-auth-content");
let mode = "login";
let busy = false;
let currentSession = null;
let notice = { text: "", type: "info" };
let autoScannedUserId = null;
let dashboardOpening = false;
let dashboardScriptLoaded = false;
let stopRemoteLiveSync = null;
let onboardingState = "login"; // login | checking | choice | import | opening | error
let onboardingUserId = null;
let onboardingError = "";
let onboardingPromise = null;
let showImportDetails = false;
const localKeys = ["gymflow-v3", "gymflow-v2", "gymflow-v1"];
const importSkipPrefix = "gymflow-legacy-import-choice-v1:";

function importSkipKey(userId) {
  return `${importSkipPrefix}${userId}`;
}

function isLegacyImportSkipped(userId = currentSession?.user?.id) {
  if (!userId) return false;
  try { return window.localStorage.getItem(importSkipKey(userId)) === "skip-local-import"; }
  catch { return false; }
}
const validMuscles = new Set(["Cardio", "Chest", "Back", "Shoulders", "Legs", "Arms", "Core"]);
const validDays = new Set(["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]);
const builtinExerciseIds = new Set([
  "ex_treadmill", "ex_cycling", "ex_chest_fly_machine", "ex_chest_press", "ex_bench", "ex_incline",
  "ex_sumo_squat", "ex_hip_abduction", "ex_squat", "ex_rdl", "ex_bulgarian", "ex_leg_press",
  "ex_leg_ext", "ex_leg_curl", "ex_row", "ex_pullup", "ex_ohp", "ex_lateral", "ex_curl",
  "ex_pushdown", "ex_plank", "ex_chest_dip", "ex_cable_cross", "ex_decline_db", "ex_tbar_row",
  "ex_seated_row", "ex_straight_pulldown", "ex_arnold_press", "ex_face_pull", "ex_front_raise",
  "ex_hammer_curl", "ex_preacher_curl", "ex_skull_crusher", "ex_oh_tricep", "ex_hanging_leg",
  "ex_russian_twist", "ex_ab_wheel"
]);
let importState = {
  scanning: false,
  importing: false,
  candidate: null,
  errors: [],
  message: "",
  messageType: "info",
  backupDone: false,
  confirmed: false,
  serverCounts: null,
  completedBefore: false,
  completedCounts: null,
  result: null,
  normalizationWarnings: 0
};

function safeEmail(session) {
  return session?.user?.email || "akun kamu";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function setNotice(text, type = "info") {
  notice = { text, type };
  const element = content.querySelector("#gf-auth-notice");
  if (element) {
    element.textContent = text;
    element.className = `gf-auth-notice ${type}`;
    element.hidden = !text;
  }
}

function noticeMarkup() {
  return `<div id="gf-auth-notice" class="gf-auth-notice ${notice.type}" role="status" ${notice.text ? "" : "hidden"}>${escapeHtml(notice.text)}</div>`;
}

function importMessageMarkup() {
  if (!importState.message) return "";
  return `<div class="gf-auth-notice ${escapeHtml(importState.messageType)}" role="status">${escapeHtml(importState.message)}</div>`;
}

function inspectLegacyProgress() {
  let candidates;
  try { candidates = getRawLocalCandidates(); }
  catch (error) {
    return { hasSource: false, hasProgress: false, unreadable: true, error: error?.message || "LocalStorage tidak bisa dibaca." };
  }
  if (!candidates.length) return { hasSource: false, hasProgress: false, unreadable: false, candidates: [] };

  const picked = candidates[0];
  try {
    const payload = JSON.parse(picked.raw);
    const counts = calculateCounts(payload);
    const hasActive = isPlainObject(payload?.activeSession);
    const hasProgress = Boolean(counts.customExercises || counts.routines || counts.completedSessions || counts.weightRecords || hasActive);
    return { hasSource: true, hasProgress, unreadable: false, key: picked.key, counts, candidates };
  } catch {
    // A malformed but present key must be backed up/reviewed, not silently ignored.
    return { hasSource: true, hasProgress: true, unreadable: true, key: picked.key, candidates };
  }
}

function onboardingChoiceMarkup() {
  const local = inspectLegacyProgress();
  const countText = local.counts
    ? `${local.counts.routines} routine · ${local.counts.completedSessions} workout · ${local.counts.weightRecords} catatan berat`
    : "Data lokal ditemukan tetapi belum bisa dibaca otomatis.";
  return `
    <div class="gf-auth-session-icon" aria-hidden="true">✓</div>
    <h2 class="gf-auth-heading">Selamat datang di GYMFlow</h2>
    <p class="gf-auth-copy">Login berhasil sebagai <strong>${escapeHtml(safeEmail(currentSession))}</strong>. Pilih cara memulai sekali saja.</p>
    <section class="gf-onboarding-choice" aria-labelledby="gf-onboarding-title">
      <p class="gf-import-kicker">PILIH LANGKAH BERIKUTNYA</p>
      <h3 id="gf-onboarding-title">Progress lama ditemukan</h3>
      <p class="gf-import-copy">${escapeHtml(countText)}</p>
      <button id="gf-onboarding-import" class="gf-auth-primary gf-import-full" type="button">Pindahkan progress lama</button>
      <button id="gf-onboarding-fresh" class="gf-auth-secondary gf-import-full" type="button">Mulai baru di akun ini</button>
      <button id="gf-onboarding-backup" class="gf-auth-text-button" type="button">Unduh backup dulu</button>
      <p class="gf-import-small">Progress lokal tidak akan dihapus. Kalau browser ini pernah dipakai akun lain, pilih “Mulai baru di akun ini” agar datanya tidak tercampur.</p>
    </section>
    <div class="gf-auth-actions"><button id="gf-auth-signout" class="gf-auth-secondary" type="button">Keluar</button></div>
  `;
}

function bindChoiceActions() {
  content.querySelector("#gf-onboarding-import")?.addEventListener("click", () => {
    onboardingState = "import";
    showImportDetails = true;
    onboardingError = "";
    resetImportState();
    render();
    void scanLegacyData();
  });
  content.querySelector("#gf-onboarding-fresh")?.addEventListener("click", skipLocalImportForCurrentUser);
  content.querySelector("#gf-onboarding-backup")?.addEventListener("click", downloadBrowserBackup);
  content.querySelector("#gf-auth-signout")?.addEventListener("click", signOut);
}

function renderOnboardingStatus(title, copy, showRetry = false) {
  content.innerHTML = `
    <div class="gf-auth-session-icon" aria-hidden="true">${showRetry ? "!" : "✓"}</div>
    <h2 class="gf-auth-heading">${escapeHtml(title)}</h2>
    <p class="gf-auth-copy">${escapeHtml(copy)}</p>
    ${showRetry ? `<div class="gf-auth-notice error" role="alert">${escapeHtml(onboardingError || "Coba periksa koneksi lalu ulangi.")}</div><button id="gf-onboarding-retry" class="gf-auth-primary gf-import-full" type="button">Coba lagi</button><button id="gf-auth-signout" class="gf-auth-secondary gf-import-full" type="button">Keluar</button>` : ""}
  `;
  content.querySelector("#gf-onboarding-retry")?.addEventListener("click", () => {
    onboardingUserId = null;
    void routeAuthenticatedUser(currentSession);
  });
  content.querySelector("#gf-auth-signout")?.addEventListener("click", signOut);
}

function importPanelMarkup() {
  const candidate = importState.candidate;
  const scanningOrImporting = importState.scanning || importState.importing;

  if (currentSession && isLegacyImportSkipped(currentSession.user.id)) {
    return `
      <section class="gf-import-panel" aria-labelledby="gf-import-title">
        <div class="gf-import-heading-row">
          <div><p class="gf-import-kicker">MIGRASI DATA</p><h3 id="gf-import-title">Progress lokal tidak diimpor</h3></div>
          <span class="gf-import-status-pill">Akun ini</span>
        </div>
        <div class="gf-auth-notice success" role="status">Impor LocalStorage dilewati untuk akun ini. Dashboard hanya memuat data dari akun Supabase yang sedang login. Data lokal lama tetap tersimpan di browser dan tidak dihapus.</div>
        <p class="gf-import-copy">Pilihan ini cocok jika data yang terdeteksi milik pengguna lain atau akun ini ingin mulai dari progress kosong. Jangan impor backup milik orang lain.</p>
        <button id="gf-import-backup-skipped" class="gf-auth-secondary gf-import-full" type="button">Unduh backup data lokal browser ini</button>
        <button id="gf-import-review" class="gf-auth-secondary gf-import-full" type="button" ${scanningOrImporting ? "disabled" : ""}>Tinjau opsi impor lokal lagi</button>
      </section>
    `;
  }

  let markup = `
    <section class="gf-import-panel" aria-labelledby="gf-import-title">
      <div class="gf-import-heading-row">
        <div>
          <p class="gf-import-kicker">MIGRASI DATA</p>
          <h3 id="gf-import-title">Impor progress lama</h3>
        </div>
        <span class="gf-import-status-pill">LocalStorage</span>
      </div>
      <p class="gf-import-copy">Pindahkan progress dari browser ini ke akun yang sedang login. Data lokal tidak akan dihapus oleh proses impor.</p>
      ${importMessageMarkup()}
      <button id="gf-import-scan" class="gf-auth-secondary gf-import-full" type="button" ${scanningOrImporting ? "disabled" : ""}>${importState.scanning ? "Memeriksa data…" : "Deteksi progress lokal"}</button>
      <input id="gf-import-backup-file" class="gf-import-file-input" type="file" accept="application/json,.json" ${scanningOrImporting ? "disabled" : ""}>
      <button id="gf-import-choose-file" class="gf-auth-secondary gf-import-full" type="button" ${scanningOrImporting ? "disabled" : ""}>Pilih backup JSON dari browser lama</button>
  `;

  if (candidate) {
    const counts = candidate.counts;
    markup += `
      <div class="gf-import-preview">
        <div class="gf-import-source"><span>Sumber terdeteksi</span><strong>${escapeHtml(candidate.key)}</strong></div>
        <div class="gf-import-count-grid">
          <div><strong>${counts.customExercises}</strong><span>Exercise custom</span></div>
          <div><strong>${counts.routines}</strong><span>Routine</span></div>
          <div><strong>${counts.completedSessions}</strong><span>Workout selesai</span></div>
          <div><strong>${counts.activeSessions}</strong><span>Sesi aktif</span></div>
          <div><strong>${counts.weightRecords}</strong><span>Catatan berat</span></div>
        </div>
        <p class="gf-import-small">ID lokal dipertahankan sebagai legacy ID. Snapshot nama exercise dan detail set tetap tersimpan dalam riwayat.</p>
        ${importState.normalizationWarnings ? `<div class="gf-auth-notice info">${importState.normalizationWarnings} nilai angka kosong ditemukan dan akan dinormalkan aman sebelum impor. Sumber asli tidak diubah.</div>` : ""}
        <button id="gf-import-back-choice" class="gf-auth-text-button" type="button" ${scanningOrImporting ? "disabled" : ""}>← Kembali ke pilihan</button>
        <p class="gf-import-small">Klik tombol utama untuk mengunduh backup terlebih dahulu lalu memulai impor. File cadangan disimpan pada perangkatmu.</p>
        <button id="gf-import-backup" class="gf-auth-text-button" type="button" ${scanningOrImporting ? "disabled" : ""}>Unduh backup tanpa mengimpor</button>
        <label class="gf-import-confirm">
          <input id="gf-import-confirm" type="checkbox" ${importState.confirmed ? "checked" : ""} ${scanningOrImporting ? "disabled" : ""}>
          <span>Saya paham bahwa catatan berat lama tidak menyimpan satuan per-record. Impor akan memakai satuan saat ini (${escapeHtml(candidate.payload.settings.weightUnit || "kg")}) untuk semua catatan lama, dan memasukkan data ke akun yang sedang login.</span>
        </label>
        ${importState.serverCounts ? `
          <div class="gf-import-server-counts"><strong>Data yang sudah ada di akun server</strong><span>Exercise custom: ${importState.serverCounts.exercises} · Routine: ${importState.serverCounts.routines} · Sesi: ${importState.serverCounts.sessions} · Catatan berat: ${importState.serverCounts.weights}</span></div>
        ` : ""}
        ${importState.completedBefore ? `<div class="gf-auth-notice success">Impor dengan identitas data ini sudah tercatat selesai. Tidak perlu mengimpor ulang.</div>` : ""}
        ${importState.serverCounts && (importState.serverCounts.exercises + importState.serverCounts.routines + importState.serverCounts.sessions + importState.serverCounts.weights) > 0 && !importState.completedBefore ? `<div class="gf-auth-notice error">Akun ini sudah memiliki data latihan di server. Demi mencegah penggabungan atau penimpaan data, impor otomatis diblokir. Tidak ada data yang diubah.</div>` : ""}
        ${importState.result ? `<div class="gf-import-result"><strong>Impor selesai ✓</strong><span>${formatImportCounts(importState.result.imported_counts || {})}</span><span>Backup dan LocalStorage asli tetap dipertahankan.</span></div>` : ""}
        <button id="gf-import-run" class="gf-auth-primary gf-import-full" type="button" ${(!importState.confirmed || scanningOrImporting || importState.completedBefore || !importState.serverCounts || (importState.serverCounts.exercises + importState.serverCounts.routines + importState.serverCounts.sessions + importState.serverCounts.weights) > 0 || candidate.errors.length > 0 || importState.result) ? "disabled" : ""}>${importState.importing ? "Menyimpan progress…" : "Backup & pindahkan progress"}</button>
        ${!importState.completedBefore && !importState.result ? `<button id="gf-import-skip" class="gf-auth-secondary gf-import-full" type="button" ${scanningOrImporting ? "disabled" : ""}>Lewati impor lokal untuk akun ini</button><p class="gf-import-small">Data LocalStorage di browser yang sama bisa berasal dari pengguna lain. Jika akun ini harus mulai kosong, lewati impor; data lokal tidak akan dihapus dan tidak akan dikirim ke akun ini.</p>` : ""}
      </div>
    `;
  }
  markup += `</section>`;
  return markup;
}

function formatImportCounts(counts) {
  const parts = [
    `${Number(counts.custom_exercises || 0)} exercise custom`,
    `${Number(counts.routines || 0)} routine`,
    `${Number(counts.completed_sessions || 0)} workout selesai`,
    `${Number(counts.active_sessions || 0)} sesi aktif`,
    `${Number(counts.workout_sets || 0)} set`,
    `${Number(counts.weight_records || 0)} catatan berat`
  ];
  return parts.join(" · ");
}

function render() {
  if (currentSession && mode !== "update-password") {
    if (importState.candidate && importState.candidate.userId !== currentSession.user.id) resetImportState();
    if (onboardingState === "checking") {
      renderOnboardingStatus("Menyiapkan akun…", "Memeriksa progress akun kamu dengan aman.");
      return;
    }
    if (onboardingState === "choice") {
      content.innerHTML = onboardingChoiceMarkup();
      bindChoiceActions();
      return;
    }
    if (onboardingState === "opening") {
      renderOnboardingStatus("Membuka GYMFlow…", "Memuat progress milik akun kamu dari Supabase.");
      return;
    }
    if (onboardingState === "error") {
      renderOnboardingStatus("Belum bisa membuka GYMFlow", "Kami belum bisa memastikan data akun kamu.", true);
      return;
    }
    content.innerHTML = `
      <div class="gf-auth-session-icon" aria-hidden="true">✓</div>
      <h2 class="gf-auth-heading">Akun berhasil terhubung</h2>
      <p class="gf-auth-copy">Session Supabase aktif untuk <strong>${escapeHtml(safeEmail(currentSession))}</strong>.</p>
      <div class="gf-auth-notice info" role="status">Data utama GYMFlow dimuat dari Supabase setelah kamu membuka dashboard. Kalau progress lokal ditemukan, selesaikan atau verifikasi impor terlebih dahulu.</div>
      ${importPanelMarkup()}
      <div class="gf-auth-actions gf-auth-actions-primary">
        <button id="gf-auth-open-dashboard" class="gf-auth-primary" type="button" ${busy || dashboardOpening || importState.scanning || importState.importing ? "disabled" : ""}>${dashboardOpening ? "Menyiapkan dashboard…" : "Buka Dashboard GYMFlow"}</button>
      </div>
      <div class="gf-auth-actions">
        <button id="gf-auth-signout" class="gf-auth-secondary" type="button" ${busy || importState.importing || dashboardOpening ? "disabled" : ""}>Keluar</button>
        <button id="gf-auth-refresh" class="gf-auth-primary" type="button" ${busy || importState.importing || dashboardOpening ? "disabled" : ""}>Periksa sesi</button>
      </div>
    `;
    content.querySelector("#gf-auth-open-dashboard").addEventListener("click", openDashboard);
    content.querySelector("#gf-auth-signout").addEventListener("click", signOut);
    content.querySelector("#gf-auth-refresh").addEventListener("click", refreshSession);
    content.querySelector("#gf-import-scan")?.addEventListener("click", scanLegacyData);
    content.querySelector("#gf-import-choose-file")?.addEventListener("click", () => content.querySelector("#gf-import-backup-file")?.click());
    content.querySelector("#gf-import-backup-file")?.addEventListener("change", handleBackupFile);
    content.querySelector("#gf-import-back-choice")?.addEventListener("click", () => { onboardingState = "choice"; showImportDetails = false; render(); });
    content.querySelector("#gf-import-backup")?.addEventListener("click", downloadLocalBackup);
    content.querySelector("#gf-import-confirm")?.addEventListener("change", event => {
      importState.confirmed = event.currentTarget.checked;
      const button = content.querySelector("#gf-import-run");
      if (button) button.disabled = !canImport();
    });
    content.querySelector("#gf-import-run")?.addEventListener("click", runImport);
    content.querySelector("#gf-import-skip")?.addEventListener("click", skipLocalImportForCurrentUser);
    content.querySelector("#gf-import-review")?.addEventListener("click", reviewLegacyImportAgain);
    content.querySelector("#gf-import-backup-skipped")?.addEventListener("click", downloadBrowserBackup);
    return;
  }

  const copy = {
    login: { heading: "Selamat datang kembali", sub: "Masuk untuk melanjutkan perjalanan fitness kamu.", button: "Masuk", toggle: "Belum punya akun?", toggleAction: "Buat akun" },
    signup: { heading: "Buat akun GYMFlow", sub: "Buat akun untuk menyiapkan sinkronisasi progres latihan.", button: "Daftar", toggle: "Sudah punya akun?", toggleAction: "Masuk" },
    reset: { heading: "Reset password", sub: "Kami akan mengirim tautan pemulihan ke email kamu.", button: "Kirim tautan reset", toggle: "Ingat password?", toggleAction: "Kembali masuk" },
    "update-password": { heading: "Buat password baru", sub: "Gunakan sedikitnya 8 karakter untuk password baru.", button: "Simpan password baru", toggle: "", toggleAction: "" }
  }[mode];

  const needsPassword = mode === "login" || mode === "signup" || mode === "update-password";
  const emailField = mode !== "update-password";
  content.innerHTML = `
    <h2 class="gf-auth-heading">${copy.heading}</h2>
    <p class="gf-auth-copy">${copy.sub}</p>
    ${noticeMarkup()}
    <form id="gf-auth-form" class="gf-auth-form" novalidate>
      ${emailField ? `
        <label for="gf-auth-email">Email</label>
        <input id="gf-auth-email" name="email" type="email" autocomplete="email" placeholder="nama@email.com" required maxlength="254">
      ` : ""}
      ${needsPassword ? `
        <label for="gf-auth-password">${mode === "update-password" ? "Password baru" : "Password"}</label>
        <input id="gf-auth-password" name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" placeholder="${mode === "login" ? "Masukkan password" : "Minimal 8 karakter"}" required minlength="${mode === "login" ? "1" : "8"}" maxlength="72">
      ` : ""}
      ${mode === "signup" ? `
        <label for="gf-auth-confirm-password">Konfirmasi password</label>
        <input id="gf-auth-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" placeholder="Ulangi password" required minlength="8" maxlength="72">
      ` : ""}
      <button class="gf-auth-primary" type="submit" ${busy ? "disabled" : ""}>${busy ? "Memproses…" : copy.button}</button>
    </form>
    ${mode === "login" ? `<button id="gf-auth-forgot" class="gf-auth-text-button" type="button">Lupa password?</button>` : ""}
    ${copy.toggle ? `<p class="gf-auth-switch">${copy.toggle} <button id="gf-auth-toggle" class="gf-auth-link" type="button">${copy.toggleAction}</button></p>` : ""}
  `;

  content.querySelector("#gf-auth-form").addEventListener("submit", handleSubmit);
  content.querySelector("#gf-auth-toggle")?.addEventListener("click", () => {
    mode = mode === "signup" ? "login" : "signup";
    notice = { text: "", type: "info" };
    render();
  });
  content.querySelector("#gf-auth-forgot")?.addEventListener("click", () => {
    mode = "reset";
    notice = { text: "", type: "info" };
    render();
  });
  content.querySelector("#gf-auth-email")?.focus();
}

function setBusy(value) {
  busy = value;
  const button = content.querySelector("button[type='submit']");
  if (button) button.disabled = value;
}

function redirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (mode !== "update-password" && !email) {
    setNotice("Masukkan alamat email yang valid.", "error");
    return;
  }
  if ((mode === "signup" || mode === "update-password") && password.length < 8) {
    setNotice("Password harus terdiri dari minimal 8 karakter.", "error");
    return;
  }

  setBusy(true);
  try {
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      currentSession = data.session;
      notice = { text: "", type: "info" };
      if (currentSession) await routeAuthenticatedUser(currentSession);
      else render();
      return;
    }
    if (mode === "signup") {
      const confirmPassword = String(formData.get("confirmPassword") || "");
      if (password !== confirmPassword) {
        setNotice("Konfirmasi password belum sama.", "error");
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } });
      if (error) throw error;
      if (data.session) {
        currentSession = data.session;
        mode = "login";
        notice = { text: "", type: "info" };
        await routeAuthenticatedUser(currentSession);
      } else {
        mode = "login";
        notice = { text: "Akun dibuat. Periksa email untuk konfirmasi, lalu kembali ke sini untuk masuk.", type: "success" };
        render();
      }
      return;
    }
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
      if (error) throw error;
      mode = "login";
      notice = { text: "Jika email tersebut terdaftar, tautan pemulihan akan dikirim. Periksa inbox dan folder spam.", type: "success" };
      render();
      return;
    }
    if (mode === "update-password") {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      currentSession = data.session;
      mode = "login";
      notice = { text: "Password berhasil diperbarui.", type: "success" };
      render();
    }
  } catch (error) {
    setNotice(humanAuthError(error), "error");
  } finally {
    busy = false;
    const button = content.querySelector("button[type='submit']");
    if (button) {
      button.disabled = false;
      const labels = { login: "Masuk", signup: "Daftar", reset: "Kirim tautan reset", "update-password": "Simpan password baru" };
      button.textContent = labels[mode] || "Lanjutkan";
    }
  }
}

function humanAuthError(error) {
  const message = String(error?.message || "");
  if (/invalid login credentials/i.test(message)) return "Email atau password belum benar.";
  if (/email not confirmed/i.test(message)) return "Email belum dikonfirmasi. Periksa email kamu terlebih dahulu.";
  if (/user already registered/i.test(message)) return "Email ini sudah terdaftar. Coba masuk.";
  if (/password should be at least/i.test(message)) return "Password terlalu pendek. Gunakan minimal 8 karakter.";
  if (/rate limit/i.test(message)) return "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.";
  return message || "Permintaan gagal. Periksa koneksi lalu coba lagi.";
}

function resetImportState() {
  importState = {
    scanning: false, importing: false, candidate: null, errors: [], message: "",
    messageType: "info", backupDone: false, confirmed: false, serverCounts: null,
    completedBefore: false, completedCounts: null, result: null, normalizationWarnings: 0
  };
}

function showImportMessage(message, type = "info") {
  importState.message = message;
  importState.messageType = type;
}

function getRawLocalCandidates() {
  const found = [];
  for (const key of localKeys) {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) found.push({ key, raw, version: Number(key.match(/v(\d+)$/)?.[1] || 1) });
  }
  return found;
}

async function skipLocalImportForCurrentUser() {
  const userId = currentSession?.user?.id;
  if (!userId || importState.importing || importState.scanning || dashboardOpening) return;
  const confirmed = window.confirm(
    "Lewati impor progress lokal untuk akun ini? Data lokal di browser TIDAK akan dihapus, tetapi tidak akan dipindahkan ke akun yang sedang login. Lanjutkan hanya jika data tersebut milik akun lain atau akun ini ingin mulai kosong."
  );
  if (!confirmed) return;
  try {
    window.localStorage.setItem(importSkipKey(userId), "skip-local-import");
    onboardingState = "opening";
    showImportMessage("Siap. Akun ini akan menggunakan data Supabase sendiri; data lokal lama tetap disimpan.", "success");
    render();
    await openDashboard({ bypassLocalPrompt: true });
  } catch (error) {
    showImportMessage(`Tidak dapat menyimpan pilihan akun: ${error?.message || "LocalStorage tidak tersedia"}.`, "error");
    render();
  }
}

function reviewLegacyImportAgain() {
  const userId = currentSession?.user?.id;
  if (!userId || importState.scanning || importState.importing || dashboardOpening) return;
  try {
    window.localStorage.removeItem(importSkipKey(userId));
  } catch (error) {
    showImportMessage(`Tidak dapat mengubah pilihan impor: ${error?.message || "LocalStorage tidak tersedia"}.`, "error");
    render();
    return;
  }
  resetImportState();
  // Prevent render() from scheduling an automatic scan; the explicit call below owns it.
  autoScannedUserId = currentSession.user.id;
  render();
  void scanLegacyData();
}

function downloadBrowserBackup() {
  try {
    const candidates = getRawLocalCandidates();
    if (!candidates.length) {
      showImportMessage("Tidak ada key progress lama di browser ini. Untuk mengambil data dari domain lama, ekspor dari origin tersebut terlebih dahulu.", "error");
      render();
      return;
    }
    const backup = {
      app: "GYMFlow",
      backupVersion: 1,
      createdAt: new Date().toISOString(),
      signedInEmail: currentSession?.user?.email || null,
      note: "Backup mentah LocalStorage GYMFlow. Berisi data latihan pribadi; simpan secara privat.",
      sourceOrigin: window.location.origin,
      localStorage: Object.fromEntries(candidates.map(item => [item.key, item.raw]))
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GYMFlow-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showImportMessage("Backup lokal berhasil disiapkan. Data asli tetap tersimpan di browser.", "success");
  } catch (error) {
    showImportMessage(`Backup gagal dibuat: ${error?.message || "kesalahan tidak diketahui"}.`, "error");
  }
  render();
}

function maybeAutoDetectLocalProgress() {
  const userId = currentSession?.user?.id;
  if (!userId || isLegacyImportSkipped(userId) || userId === autoScannedUserId || importState.scanning || importState.importing || importState.candidate || importState.result) return;
  autoScannedUserId = userId;
  let found = false;
  try { found = getRawLocalCandidates().length > 0; }
  catch (error) {
    importState.message = `Browser tidak bisa membaca LocalStorage: ${error?.message || "akses ditolak"}. Kamu masih dapat memilih backup JSON.`;
    importState.messageType = "error";
    return;
  }
  if (!found) return;
  Promise.resolve().then(() => {
    if (currentSession?.user?.id === userId && !importState.scanning && !importState.candidate && !importState.result) {
      void scanLegacyData();
    }
  });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validDateTime(value) {
  if (value === null || value === undefined || value === "") return true;
  return Number.isFinite(Date.parse(value));
}

function normalizeLegacyTimestamp(value) {
  if (value === null || value === undefined || value === "") return value;

  // Older GYMFlow builds may store Date.now() milliseconds instead of ISO timestamps.
  // 10-digit epoch timestamps are interpreted as seconds; 12–13 digits as milliseconds.
  let epoch = null;
  if (typeof value === "number" && Number.isFinite(value)) {
    epoch = value;
  } else if (typeof value === "string" && /^\\s*-?\\d{10,13}\\s*$/.test(value)) {
    epoch = Number(value.trim());
  }

  if (epoch !== null) {
    const milliseconds = Math.abs(epoch) >= 100_000_000_000 ? epoch : epoch * 1000;
    const date = new Date(milliseconds);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }

  return value;
}

function normalizeLegacyPayload(source) {
  // Work on a detached copy. The raw LocalStorage and the backup fingerprint remain untouched.
  const payload = JSON.parse(JSON.stringify(source));
  let repairedBlankNumbers = 0;
  let repairedTimestamps = 0;
  const numericKeys = ["reps", "weight"];

  const normalizeSets = (sets, isRoutineTarget = false) => {
    if (!Array.isArray(sets)) return;
    for (const set of sets) {
      if (!isPlainObject(set)) continue;
      for (const key of numericKeys) {
        const value = set[key];
        if (typeof value === "string" && value.trim() === "") {
          // Blank metrics mean "not recorded" in history, not a measured zero.
          set[key] = isRoutineTarget ? 0 : null;
          repairedBlankNumbers += 1;
        } else if (isRoutineTarget && (value === null || value === undefined)) {
          set[key] = 0;
          repairedBlankNumbers += 1;
        } else if (typeof value === "string" && Number.isFinite(Number(value.trim()))) {
          set[key] = Number(value.trim());
        }
      }

      if ("completedAt" in set) {
        const before = set.completedAt;
        set.completedAt = normalizeLegacyTimestamp(before);
        if (set.completedAt !== before) repairedTimestamps += 1;
      }
    }
  };

  for (const routine of Array.isArray(payload.routines) ? payload.routines : []) {
    for (const exercise of Array.isArray(routine?.exercises) ? routine.exercises : []) {
      normalizeSets(exercise?.sets, true);
    }
  }

  const sessions = [
    ...(Array.isArray(payload.history) ? payload.history : []),
    ...(isPlainObject(payload.activeSession) ? [payload.activeSession] : [])
  ];

  for (const session of sessions) {
    for (const key of ["startedAt", "endedAt"]) {
      if (key in session) {
        const before = session[key];
        session[key] = normalizeLegacyTimestamp(before);
        if (session[key] !== before) repairedTimestamps += 1;
      }
    }

    if (session && session.duration === "") {
      session.duration = 0;
      repairedBlankNumbers += 1;
    } else if (typeof session?.duration === "string" && Number.isFinite(Number(session.duration.trim()))) {
      session.duration = Number(session.duration.trim());
    }

    for (const exercise of Array.isArray(session?.exercises) ? session.exercises : []) {
      normalizeSets(exercise?.sets, false);
    }
  }

  if (isPlainObject(payload.settings)) {
    for (const key of ["age", "height", "weight", "weeklyGoal", "restSeconds"]) {
      const value = payload.settings[key];
      if (typeof value === "string" && value.trim() === "") {
        delete payload.settings[key];
        repairedBlankNumbers += 1;
      } else if (typeof value === "string" && Number.isFinite(Number(value.trim()))) {
        payload.settings[key] = Number(value.trim());
      }
    }
  }

  return { payload, repairedBlankNumbers, repairedTimestamps };
}

function validateLocalPayload(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return ["Data LocalStorage harus berupa objek JSON."];
  const arrayFields = ["exercises", "routines", "history", "weightHistory"];
  for (const field of arrayFields) {
    if (payload[field] !== undefined && !Array.isArray(payload[field])) errors.push(`Bagian ${field} bukan daftar yang valid.`);
  }
  if (payload.settings !== undefined && !isPlainObject(payload.settings)) errors.push("Bagian settings bukan objek yang valid.");
  if (payload.activeSession !== undefined && payload.activeSession !== null && !isPlainObject(payload.activeSession)) errors.push("Sesi aktif bukan objek yang valid.");
  if (errors.length) return errors;

  const exercises = payload.exercises || [];
  const routines = payload.routines || [];
  const history = payload.history || [];
  const weights = payload.weightHistory || [];
  const settings = payload.settings || {};
  const ids = new Set();
  for (const [index, exercise] of exercises.entries()) {
    if (!isPlainObject(exercise)) { errors.push(`Exercise ke-${index + 1} bukan objek valid.`); continue; }
    if (typeof exercise.id !== "string" || !exercise.id.trim()) errors.push(`Exercise ke-${index + 1} tidak memiliki ID.`);
    if (exercise.isCustom !== undefined && typeof exercise.isCustom !== "boolean") errors.push(`Penanda custom exercise ke-${index + 1} tidak valid.`);
    if (exercise.id && ids.has(exercise.id)) errors.push(`ID exercise duplikat: ${exercise.id}.`);
    if (exercise.id) ids.add(exercise.id);
    if (exercise.isCustom === true) {
      if (typeof exercise.name !== "string" || !exercise.name.trim() || exercise.name.trim().length > 120) errors.push(`Nama exercise custom ke-${index + 1} tidak valid.`);
      if (!validMuscles.has(exercise.muscle)) errors.push(`Target otot exercise custom ${exercise.name || index + 1} tidak valid.`);
      if (typeof exercise.equipment !== "string" || !exercise.equipment.trim() || exercise.equipment.trim().length > 80) errors.push(`Equipment exercise custom ${exercise.name || index + 1} tidak valid.`);
    }
  }

  const routineIds = new Set();
  for (const [index, routine] of routines.entries()) {
    if (!isPlainObject(routine)) { errors.push(`Routine ke-${index + 1} bukan objek valid.`); continue; }
    if (typeof routine.id !== "string" || !routine.id.trim()) errors.push(`Routine ke-${index + 1} tidak memiliki ID.`);
    if (routine.id && routineIds.has(routine.id)) errors.push(`ID routine duplikat: ${routine.id}.`);
    if (routine.id) routineIds.add(routine.id);
    if (typeof routine.name !== "string" || !routine.name.trim() || routine.name.trim().length > 50) errors.push(`Nama routine ke-${index + 1} harus 1–50 karakter.`);
    if (String(routine.description || "").length > 140) errors.push(`Deskripsi routine ${routine.name || index + 1} melebihi 140 karakter.`);
    if (routine.days !== undefined && (!Array.isArray(routine.days) || routine.days.some(day => !validDays.has(day)))) errors.push(`Jadwal hari routine ${routine.name || index + 1} tidak valid.`);
    if (routine.exerciseIds !== undefined && !Array.isArray(routine.exerciseIds)) errors.push(`exerciseIds pada routine ${routine.name || index + 1} bukan daftar.`);
    if (routine.exercises !== undefined && !Array.isArray(routine.exercises)) errors.push(`Exercises pada routine ${routine.name || index + 1} bukan daftar.`);
    const routineExercises = Array.isArray(routine.exercises) && routine.exercises.length ? routine.exercises : (routine.exerciseIds || []).map(id => ({ id, sets: [] }));
    const seenRoutineExerciseIds = new Set();
    for (const re of routineExercises) {
      if (!isPlainObject(re)) { errors.push(`Detail exercise pada routine ${routine.name || index + 1} tidak valid.`); continue; }
      const id = re.id || re.exerciseId;
      if (typeof id !== "string" || !id.trim()) errors.push(`Ada exercise tanpa ID pada routine ${routine.name || index + 1}.`);
      if (id && seenRoutineExerciseIds.has(id)) errors.push(`Exercise ${id} muncul dua kali pada routine ${routine.name || index + 1}.`);
      if (id) seenRoutineExerciseIds.add(id);
      if (re && typeof re === "object" && re.sets !== undefined && !Array.isArray(re.sets)) errors.push(`Target set pada routine ${routine.name || index + 1} tidak valid.`);
      for (const set of (Array.isArray(re?.sets) ? re.sets : [])) {
        if (!isPlainObject(set) || ["reps", "weight"].some(k => finiteNumber(set[k]) === null || finiteNumber(set[k]) < 0)) errors.push(`Target set pada routine ${routine.name || index + 1} berisi angka tidak valid.`);
      }
    }
  }

  const knownExerciseIds = new Set(exercises.map(exercise => exercise?.id).filter(id => typeof id === "string"));
  const verifyExerciseReference = (exerciseId, context) => {
    if (typeof exerciseId === "string" && exerciseId && !knownExerciseIds.has(exerciseId) && !builtinExerciseIds.has(exerciseId)) {
      errors.push(`Exercise ${exerciseId} yang dipakai ${context} tidak ada di daftar exercise lokal. Impor dihentikan agar nama/jenis latihan historis tidak ditebak.`);
    }
  };
  for (const routine of routines) {
    if (!isPlainObject(routine)) continue;
    const routineExercises = Array.isArray(routine.exercises) && routine.exercises.length ? routine.exercises : (Array.isArray(routine.exerciseIds) ? routine.exerciseIds.map(id => ({ id })) : []);
    for (const routineExercise of routineExercises) {
      if (isPlainObject(routineExercise)) verifyExerciseReference(routineExercise.id || routineExercise.exerciseId, `routine ${routine.name || routine.id || "tanpa nama"}`);
    }
  }

  const sessionIds = new Set();
  const sessions = [...history];
  if (isPlainObject(payload.activeSession)) sessions.push(payload.activeSession);
  for (const [index, session] of sessions.entries()) {
    if (!isPlainObject(session)) { errors.push(`Sesi workout ke-${index + 1} bukan objek valid.`); continue; }
    if (typeof session.id !== "string" || !session.id.trim()) errors.push(`Sesi workout ke-${index + 1} tidak memiliki ID.`);
    if (session.id && sessionIds.has(session.id)) errors.push(`ID sesi duplikat: ${session.id}.`);
    if (session.id) sessionIds.add(session.id);
    if (!validDateTime(session.startedAt) || !validDateTime(session.endedAt)) errors.push(`Timestamp pada sesi ${session.id || index + 1} tidak valid.`);
    const duration = finiteNumber(session.duration);
    if (session.duration !== undefined && (duration === null || duration < 0)) errors.push(`Durasi sesi ${session.id || index + 1} tidak valid.`);
    if (session.exercises !== undefined && !Array.isArray(session.exercises)) errors.push(`Daftar exercise pada sesi ${session.id || index + 1} tidak valid.`);
    for (const se of (Array.isArray(session.exercises) ? session.exercises : [])) {
      if (!isPlainObject(se)) { errors.push(`Detail exercise pada sesi ${session.id || index + 1} tidak valid.`); continue; }
      if (!se.exerciseId && !se.id) errors.push(`Detail exercise pada sesi ${session.id || index + 1} tidak memiliki ID.`);
      verifyExerciseReference(se.exerciseId || se.id, `sesi ${session.id || index + 1}`);
      if (se.sets !== undefined && !Array.isArray(se.sets)) errors.push(`Daftar set pada sesi ${session.id || index + 1} tidak valid.`);
      for (const set of (Array.isArray(se.sets) ? se.sets : [])) {
        if (!isPlainObject(set)) { errors.push(`Set pada sesi ${session.id || index + 1} tidak valid.`); continue; }
        for (const key of ["reps", "weight"]) {
          const n = finiteNumber(set[key]);
          if (set[key] !== undefined && set[key] !== null && (n === null || n < 0)) errors.push(`Nilai ${key} pada sesi ${session.id || index + 1} tidak valid.`);
        }
        if (!validDateTime(set.completedAt)) errors.push(`Timestamp set pada sesi ${session.id || index + 1} tidak valid.`);
      }
    }
  }

  const weightDates = new Set();
  for (const [index, record] of weights.entries()) {
    if (!isPlainObject(record)) { errors.push(`Catatan berat ke-${index + 1} bukan objek valid.`); continue; }
    const date = String(record.date || "");
    const weight = finiteNumber(record.weight);
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
    if (!parsedDate || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) errors.push(`Tanggal catatan berat ke-${index + 1} tidak valid.`);
    if (weight === null || weight <= 0 || weight >= 1000) errors.push(`Nilai berat pada catatan ke-${index + 1} tidak valid.`);
    if (weightDates.has(date)) errors.push(`Ada lebih dari satu catatan berat untuk tanggal ${date}.`);
    weightDates.add(date);
  }

  const displayName = String(settings.userName ?? "GYMFlow User").trim();
  if (!displayName || displayName.length > 80) errors.push("Nama profil harus 1–80 karakter.");
  const age = finiteNumber(settings.age);
  const height = finiteNumber(settings.height);
  const currentWeight = finiteNumber(settings.weight);
  if (settings.age !== undefined && (age === null || age < 0 || age > 120 || !Number.isInteger(age))) errors.push("Usia profil harus bilangan bulat 0–120.");
  if (settings.height !== undefined && (height === null || height <= 0 || height >= 300)) errors.push("Tinggi profil harus lebih dari 0 dan di bawah 300.");
  if (settings.weight !== undefined && (currentWeight === null || currentWeight <= 0 || currentWeight >= 1000)) errors.push("Berat profil harus lebih dari 0 dan di bawah 1000.");
  if (settings.theme !== undefined && !["dark", "light"].includes(settings.theme)) errors.push("Preferensi tema tidak valid.");
  if (settings.language !== undefined && !["id", "en"].includes(settings.language)) errors.push("Preferensi bahasa tidak valid.");
  if (settings.heightUnit !== undefined && !["cm", "ft"].includes(settings.heightUnit)) errors.push("Satuan tinggi tidak valid.");
  if (settings.weightUnit !== undefined && !["kg", "lbs"].includes(settings.weightUnit)) errors.push("Satuan berat tidak valid.");
  const rest = finiteNumber(settings.restSeconds ?? 90);
  const goal = finiteNumber(settings.weeklyGoal ?? 4);
  if (rest === null || rest < 0 || rest > 3600 || !Number.isInteger(rest)) errors.push("Waktu istirahat harus bilangan bulat 0–3600 detik.");
  if (goal === null || goal < 0 || goal > 14 || !Number.isInteger(goal)) errors.push("Target mingguan harus bilangan bulat 0–14.");

  return errors;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function calculateCounts(payload) {
  const exercises = Array.isArray(payload.exercises) ? payload.exercises : [];
  return {
    customExercises: exercises.filter(exercise => exercise?.isCustom === true).length,
    routines: Array.isArray(payload.routines) ? payload.routines.length : 0,
    completedSessions: Array.isArray(payload.history) ? payload.history.length : 0,
    activeSessions: isPlainObject(payload.activeSession) ? 1 : 0,
    weightRecords: Array.isArray(payload.weightHistory) ? payload.weightHistory.length : 0
  };
}

async function getServerSnapshot(userId, migrationKey) {
  const requests = await Promise.all([
    supabase.from("exercises").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    supabase.from("routines").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("weight_records").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("migration_logs").select("status, imported_counts, source_fingerprint").eq("user_id", userId).eq("migration_key", migrationKey).maybeSingle()
  ]);
  const errorResult = requests.find(result => result.error);
  if (errorResult) throw new Error(`Gagal memeriksa status database: ${errorResult.error.message}`);
  return {
    exercises: requests[0].count || 0,
    routines: requests[1].count || 0,
    sessions: requests[2].count || 0,
    weights: requests[3].count || 0,
    migration: requests[4].data || null
  };
}

async function prepareCandidate(picked, backupMap, sourceOrigin = window.location.origin) {
  let rawPayload;
  try { rawPayload = JSON.parse(picked.raw); }
  catch { throw new Error(`Data pada ${picked.key} tidak bisa dibaca sebagai JSON. Data lokal tidak diubah.`); }

  let normalized;
  try { normalized = normalizeLegacyPayload(rawPayload); }
  catch { throw new Error("Backup tidak bisa dinormalkan dengan aman. Data sumber tetap utuh."); }
  const payload = normalized.payload;
  const errors = validateLocalPayload(payload);
  const fingerprint = await sha256(picked.raw);
  const migrationKey = `gymflow-local-v${picked.version}-${fingerprint}`;
  importState.candidate = {
    key: picked.key,
    raw: picked.raw,
    payload,
    version: picked.version,
    fingerprint,
    migrationKey,
    counts: calculateCounts(payload),
    userId: currentSession.user.id,
    sourceOrigin,
    errors,
    backupMap: backupMap && Object.keys(backupMap).length ? backupMap : { [picked.key]: picked.raw }
  };
  importState.errors = errors;
  importState.normalizationWarnings = normalized.repairedBlankNumbers;
  if (errors.length) {
    showImportMessage(`Ada ${errors.length} masalah data yang perlu diperiksa. Impor belum dijalankan. Contoh: ${errors[0]}. Backup dan sumber asli tetap aman.`, "error");
    return;
  }
  const snapshot = await getServerSnapshot(currentSession.user.id, migrationKey);
  importState.serverCounts = {
    exercises: snapshot.exercises,
    routines: snapshot.routines,
    sessions: snapshot.sessions,
    weights: snapshot.weights
  };
  importState.completedBefore = snapshot.migration?.status === "completed";
  importState.completedCounts = snapshot.migration?.imported_counts || null;
  if (importState.completedBefore) {
    importState.result = { imported_counts: importState.completedCounts || {} };
    showImportMessage("Progress ini sudah pernah diimpor. Kamu bisa langsung melanjutkan ke dashboard.", "success");
  } else if (snapshot.exercises + snapshot.routines + snapshot.sessions + snapshot.weights > 0) {
    showImportMessage("Akun ini sudah memiliki progress di server. Untuk mencegah data tercampur, impor baru diblokir. Kamu bisa lanjut ke dashboard.", "error");
  } else {
    const warningParts = [];
    if (normalized.repairedBlankNumbers) warningParts.push(`${normalized.repairedBlankNumbers} kolom angka kosong dinormalkan (nilai riwayat tetap kosong, target routine memakai 0)`);
    if (normalized.repairedTimestamps) warningParts.push(`${normalized.repairedTimestamps} timestamp numerik diubah ke format ISO`);
    const warningCopy = warningParts.length ? ` Perbaikan aman: ${warningParts.join("; ")}.` : "";
    showImportMessage(`Preview siap.${warningCopy} Buat backup lalu konfirmasi untuk memindahkan progress.`, "success");
  }
}

async function scanLegacyData() {
  if (!currentSession || importState.scanning || importState.importing) return;
  resetImportState();
  importState.scanning = true;
  showImportMessage("Membaca data lokal tanpa mengubah atau menghapusnya…", "info");
  render();
  try {
    const candidates = getRawLocalCandidates();
    if (!candidates.length) {
      showImportMessage("Tidak ada key LocalStorage lama di origin browser ini. Jika progress masih ada di domain/perangkat/browser lama, gunakan tombol ‘Pilih backup JSON dari browser lama’. LocalStorage tidak bisa dibaca lintas-origin secara langsung.", "info");
    } else {
      // The newest present key is used. If it is malformed, do not silently fall back to an older version.
      const picked = candidates[0];
      const backupMap = Object.fromEntries(candidates.map(item => [item.key, item.raw]));
      await prepareCandidate(picked, backupMap);
    }
  } catch (error) {
    importState.candidate = null;
    showImportMessage(error?.message || "Gagal membaca data lokal.", "error");
  } finally {
    importState.scanning = false;
    render();
  }
}

async function handleBackupFile(event) {
  const file = event.currentTarget.files?.[0];
  event.currentTarget.value = "";
  if (!file || !currentSession || importState.scanning || importState.importing) return;
  importState.scanning = true;
  importState.candidate = null;
  importState.serverCounts = null;
  importState.backupDone = false;
  importState.confirmed = false;
  showImportMessage("Membaca file backup JSON…", "info");
  render();
  try {
    const text = await file.text();
    const parsedFile = JSON.parse(text);
    let backupMap = null;
    let picked = null;
    if (isPlainObject(parsedFile?.localStorage)) {
      backupMap = parsedFile.localStorage;
      for (const key of localKeys) {
        if (typeof backupMap[key] === "string") {
          picked = { key, raw: backupMap[key], version: Number(key.match(/v(\d+)$/)?.[1] || 1) };
          break;
        }
      }
    } else if (isPlainObject(parsedFile) && ("settings" in parsedFile || "exercises" in parsedFile || "history" in parsedFile)) {
      // Also accept a raw JSON export of the old app state.
      picked = { key: "gymflow-v3", raw: text, version: 3 };
      backupMap = { "gymflow-v3": text };
    }
    if (!picked) throw new Error("File ini bukan backup GYMFlow yang dikenali atau tidak berisi gymflow-v3/v2/v1.");
    await prepareCandidate(picked, backupMap, parsedFile.sourceOrigin || "file backup eksternal");
    showImportMessage(importState.errors.length ? importState.message : `Backup ${file.name} terbaca. Periksa preview, lalu unduh salinan backup dan konfirmasi satuan berat.`, importState.errors.length ? "error" : "success");
  } catch (error) {
    importState.candidate = null;
    showImportMessage(error?.message || "File backup tidak bisa dibaca.", "error");
  } finally {
    importState.scanning = false;
    render();
  }
}

function canImport() {
  const c = importState.candidate;
  const server = importState.serverCounts;
  return Boolean(
    currentSession && c && c.userId === currentSession.user.id && !c.errors.length &&
    importState.confirmed && !importState.scanning && !importState.importing &&
    server && (server.exercises + server.routines + server.sessions + server.weights) === 0 &&
    !importState.completedBefore && !importState.result
  );
}

function downloadLocalBackup() {
  if (!currentSession || !importState.candidate) return;
  try {
    const data = {
      app: "GYMFlow",
      backupVersion: 1,
      createdAt: new Date().toISOString(),
      signedInEmail: currentSession.user.email || null,
      note: "Cadangan mentah key LocalStorage versi GYMFlow. Jangan bagikan file ini karena berisi riwayat latihan pribadi.",
      sourceOrigin: importState.candidate.sourceOrigin || window.location.origin,
      localStorage: importState.candidate.backupMap || Object.fromEntries(getRawLocalCandidates().map(item => [item.key, item.raw]))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GYMFlow-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    importState.backupDone = true;
    showImportMessage("File backup sudah diminta untuk diunduh. Simpan file tersebut sebelum melanjutkan.", "success");
  } catch (error) {
    showImportMessage(`Backup gagal dibuat: ${error?.message || "kesalahan tidak diketahui"}`, "error");
  }
  render();
}

async function runImport() {
  if (!canImport()) {
    showImportMessage("Impor belum bisa dijalankan. Konfirmasi satuan, pastikan validasi bersih, dan akun server masih kosong.", "error");
    render();
    return;
  }
  // Start the backup download synchronously from the same user click, before awaiting any network request.
  if (!importState.backupDone) downloadLocalBackup();
  if (!importState.backupDone) {
    showImportMessage("Backup belum bisa dibuat. Unduh backup secara terpisah lalu coba lagi.", "error");
    render();
    return;
  }
  importState.importing = true;
  showImportMessage("Mengirim data ke database dalam satu transaksi. LocalStorage tidak akan dihapus…", "info");
  render();
  try {
    const c = importState.candidate;
    // Normalize absent optional arrays only; retain all existing source fields for audit/snapshots.
    const payload = {
      ...c.payload,
      settings: isPlainObject(c.payload.settings) ? c.payload.settings : {},
      exercises: Array.isArray(c.payload.exercises) ? c.payload.exercises : [],
      routines: Array.isArray(c.payload.routines) ? c.payload.routines : [],
      history: Array.isArray(c.payload.history) ? c.payload.history : [],
      weightHistory: Array.isArray(c.payload.weightHistory) ? c.payload.weightHistory : [],
      activeSession: isPlainObject(c.payload.activeSession) ? c.payload.activeSession : null
    };
    const { data, error } = await supabase.rpc("gymflow_import_legacy_payload", {
      p_migration_key: c.migrationKey,
      p_source_key: c.key,
      p_source_schema_version: c.version,
      p_source_fingerprint: c.fingerprint,
      p_payload: payload
    });
    if (error) throw new Error(error.message || "RPC impor gagal.");
    if (!data || data.status !== "completed") throw new Error(data?.message || "Impor dibatalkan oleh database. Tidak ada data latihan yang diselesaikan impor.");
    importState.result = data;
    importState.completedBefore = Boolean(data.already_completed);
    showImportMessage(data.already_completed ? "Impor ini sudah selesai sebelumnya; tidak ada data duplikat yang dibuat." : "Impor dan transaksi database selesai. Sekarang periksa jumlah data sebelum lanjut ke integrasi dashboard.", "success");
  } catch (error) {
    showImportMessage(error?.message || "Impor gagal. LocalStorage tetap dipertahankan.", "error");
  } finally {
    importState.importing = false;
    render();
  }
}


function setRemoteSyncStatus(state, message = "") {
  const element = document.getElementById("gf-remote-sync-status");
  if (!element) return;
  element.dataset.syncState = state;
  element.title = message || state;
  const labels = {
    ready: "Supabase",
    saving: "Menyimpan…",
    saved: "Tersimpan",
    error: "Gagal simpan"
  };
  element.textContent = labels[state] || "Supabase";
  element.setAttribute("aria-label", message || labels[state] || "Status sinkronisasi");
}

function decorateRemoteStorageCopy() {
  document.querySelectorAll("p").forEach(element => {
    const text = element.textContent.trim();
    if (text === "Data tersimpan di perangkat ini.") element.textContent = "Data tersimpan di akun Supabase kamu.";
    if (text.startsWith("All data is stored locally on your device.")) {
      element.textContent = "Data workout dan progress disimpan ke akun Supabase kamu. Jaga keamanan akun dan selalu gunakan tombol logout saat memakai perangkat bersama.";
    }
  });
  document.querySelectorAll("strong").forEach(element => {
    if (element.textContent.trim() === "Local device") element.textContent = "Supabase Cloud";
  });
}

function installDashboardControls() {
  const shell = document.querySelector(".app-shell");
  const actions = shell?.querySelector(".main-area header > .flex.items-center.gap-2");
  const profileButton = actions?.querySelector("#open-profile-btn");
  if (!actions || !profileButton) return;

  if (!actions.querySelector("#gf-remote-sync-status")) {
    const status = document.createElement("span");
    status.id = "gf-remote-sync-status";
    status.className = "chip gf-remote-sync-status";
    status.setAttribute("role", "status");
    status.textContent = "Supabase";
    status.tabIndex = 0;
    status.setAttribute("role", "button");
    status.setAttribute("aria-label", "Status sinkronisasi. Klik untuk mencoba menyimpan ulang jika ada error.");
    status.addEventListener("click", () => {
      if (typeof window.__GYMFLOW_FLUSH_REMOTE_SAVE === "function") {
        void window.__GYMFLOW_FLUSH_REMOTE_SAVE().catch(error => setRemoteSyncStatus("error", error?.message || "Penyimpanan ulang gagal."));
      }
    });
    status.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (typeof window.__GYMFLOW_FLUSH_REMOTE_SAVE === "function") void window.__GYMFLOW_FLUSH_REMOTE_SAVE().catch(error => setRemoteSyncStatus("error", error?.message || "Penyimpanan ulang gagal."));
      }
    });
    actions.insertBefore(status, profileButton);
  }
  if (!actions.querySelector("#gf-auth-app-logout")) {
    const logout = document.createElement("button");
    logout.id = "gf-auth-app-logout";
    logout.type = "button";
    logout.className = "icon-btn gf-auth-app-logout";
    logout.title = "Keluar dari akun GYMFlow";
    logout.setAttribute("aria-label", "Keluar dari akun GYMFlow");
    logout.innerHTML = '<i data-lucide="log-out" aria-hidden="true"></i>';
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      logout.title = "Sedang keluar…";
      try {
        if (typeof window.__GYMFLOW_FLUSH_REMOTE_SAVE === "function") {
          await window.__GYMFLOW_FLUSH_REMOTE_SAVE();
        }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.reload();
      } catch (error) {
        logout.disabled = false;
        setRemoteSyncStatus("error", error?.message || "Gagal logout atau menyelesaikan penyimpanan.");
      }
    });
    actions.insertBefore(logout, profileButton);
  }
  if (window.lucide) window.lucide.createIcons();
}

async function routeAuthenticatedUser(session) {
  const userId = session?.user?.id;
  if (!userId || mode === "update-password" || dashboardScriptLoaded) return;
  if (onboardingUserId === userId && onboardingPromise) return onboardingPromise;
  onboardingUserId = userId;
  onboardingState = "checking";
  onboardingError = "";
  render();

  let pending;
  pending = (async () => {
    try {
      const skipped = isLegacyImportSkipped(userId);
      const local = inspectLegacyProgress();
      const { meta } = await loadRemoteState();
      if (currentSession?.user?.id !== userId) return;
      const counts = meta?.server_counts || {};
      const hasServerRecords = Number(counts.exercises || 0) + Number(counts.routines || 0) + Number(counts.sessions || 0) + Number(counts.weights || 0) > 0;
      const alreadyHasAccountData = Boolean(meta?.has_completed_import) || hasServerRecords;

      // Existing remote data always wins. Ignore shared browser LocalStorage for that account.
      if (skipped || alreadyHasAccountData || !local.hasProgress) {
        onboardingState = "opening";
        render();
        await openDashboard({ bypassLocalPrompt: true });
      } else {
        // Only new/empty accounts are asked whether to import this origin's old data.
        onboardingState = "choice";
        render();
      }
    } catch (error) {
      if (currentSession?.user?.id !== userId) return;
      onboardingError = error?.message || "Gagal memeriksa session dan data akun.";
      onboardingState = "error";
      render();
    } finally {
      if (onboardingPromise === pending) onboardingPromise = null;
    }
  })();
  onboardingPromise = pending;
  return pending;
}

async function openDashboard(options = {}) {
  if (!currentSession || dashboardOpening || importState.scanning || importState.importing) return;
  if (dashboardScriptLoaded) return;

  const bypassLocalPrompt = options === true || options?.bypassLocalPrompt === true;
  const skipLocalImport = isLegacyImportSkipped(currentSession.user.id);
  dashboardOpening = true;
  onboardingState = "opening";
  render();
  try {
    const { state, meta } = await loadRemoteState();
    const server = meta?.server_counts || {};
    const hasServerRecords = Number(server.exercises || 0) + Number(server.routines || 0) + Number(server.sessions || 0) + Number(server.weights || 0) > 0;
    const local = inspectLegacyProgress();
    const accountAlreadyHasData = Boolean(meta?.has_completed_import) || hasServerRecords || importState.completedBefore || Boolean(importState.result);

    if (!skipLocalImport && !bypassLocalPrompt && local.hasProgress && !accountAlreadyHasData) {
      onboardingState = showImportDetails ? "import" : "choice";
      showImportMessage("Progress lama terdeteksi. Pilih pindahkan progress atau mulai baru di akun ini.", "info");
      render();
      return;
    }
    if (!state.settings) {
      throw new Error("Data akun belum dapat disiapkan. Muat ulang halaman dan coba lagi.");
    }

    window.__GYMFLOW_REMOTE_MODE = true;
    window.__GYMFLOW_REMOTE_STATE = state;
    window.__GYMFLOW_QUEUE_SAVE = createRemoteSaveQueue(supabase, currentSession.user.id, setRemoteSyncStatus);
    window.__GYMFLOW_FLUSH_REMOTE_SAVE = window.__GYMFLOW_QUEUE_SAVE.flush;
    window.__GYMFLOW_SET_SYNC_STATUS = setRemoteSyncStatus;
    setRemoteSyncStatus("ready", "Data utama dimuat dari Supabase");

    if (appShell) {
      appShell.removeAttribute("inert");
      appShell.removeAttribute("aria-hidden");
    }
    const existingScript = document.querySelector('script[data-gymflow-remote-app="true"]');
    if (!existingScript) {
      await new Promise((resolve, reject) => {
        const appScript = document.createElement("script");
        appScript.src = "./script.js?gymflowRemote=1";
        appScript.dataset.gymflowRemoteApp = "true";
        appScript.onload = () => {
          if (!window.__GYMFLOW_APP_READY) {
            reject(new Error("Dashboard belum selesai diinisialisasi. Periksa Console browser untuk detail error."));
            return;
          }
          resolve();
        };
        appScript.onerror = () => reject(new Error("script.js gagal dimuat. Pastikan file dashboard lama masih ada di folder yang sama."));
        document.body.appendChild(appScript);
      });
    }

    dashboardScriptLoaded = true;
    document.body.classList.remove("gf-auth-only");
    gate.remove();
    installDashboardControls();
    setRemoteSyncStatus("ready", "Data utama dimuat dari Supabase");
    decorateRemoteStorageCopy();

    stopRemoteLiveSync?.();
    stopRemoteLiveSync = startRemoteLiveSync({
      client: supabase,
      userId: currentSession.user.id,
      getCurrentUserId: () => currentSession?.user?.id || null,
      getCurrentState: () => window.__GYMFLOW_GET_CURRENT_STATE?.() || null,
      canApplyState: () => window.__GYMFLOW_CAN_APPLY_REMOTE_STATE?.() === true,
      applyState: nextState => window.__GYMFLOW_APPLY_REMOTE_STATE?.(nextState),
      fetchState: loadRemoteState,
      onStatus: setRemoteSyncStatus
    });
  } catch (error) {
    stopRemoteLiveSync?.();
    stopRemoteLiveSync = null;
    dashboardScriptLoaded = false;
    // Allow a clean retry if the dynamically loaded legacy UI script failed partway through boot.
    document.querySelector('script[data-gymflow-remote-app="true"]')?.remove();
    window.__GYMFLOW_APP_READY = false;
    window.__GYMFLOW_REMOTE_MODE = false;
    window.__GYMFLOW_REMOTE_STATE = null;
    window.__GYMFLOW_QUEUE_SAVE = null;
    window.__GYMFLOW_FLUSH_REMOTE_SAVE = null;
    if (appShell) {
      appShell.setAttribute("inert", "");
      appShell.setAttribute("aria-hidden", "true");
    }
    onboardingError = error?.message || "Dashboard gagal dimuat dari Supabase.";
    onboardingState = "error";
    showImportMessage(onboardingError, "error");
  } finally {
    dashboardOpening = false;
    if (!dashboardScriptLoaded) render();
  }
}

async function signOut() {
  if (busy || importState.importing) return;
  busy = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    currentSession = null;
    resetImportState();
    autoScannedUserId = null;
    onboardingUserId = null;
    onboardingState = "login";
    onboardingError = "";
    mode = "login";
    notice = { text: "Kamu sudah keluar.", type: "success" };
    render();
  } catch (error) {
    setNotice(humanAuthError(error), "error");
  } finally {
    busy = false;
  }
}

async function refreshSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setNotice(humanAuthError(error), "error");
    return;
  }
  if (currentSession?.user?.id && data.session?.user?.id && currentSession.user.id !== data.session.user.id) resetImportState();
  currentSession = data.session;
  mode = "login";
  if (!currentSession) {
    onboardingState = "login";
    onboardingUserId = null;
    render();
  } else {
    void routeAuthenticatedUser(currentSession);
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  const oldUserId = currentSession?.user?.id;
  const newUserId = session?.user?.id;
  if (oldUserId !== newUserId) {
    stopRemoteLiveSync?.();
    stopRemoteLiveSync = null;
    resetImportState();
    autoScannedUserId = null;
    onboardingUserId = null;
    onboardingPromise = null;
  }
  currentSession = session;
  if (event === "PASSWORD_RECOVERY") {
    mode = "update-password";
    notice = { text: "Tautan pemulihan terverifikasi. Masukkan password baru.", type: "info" };
    render();
    return;
  }
  if (!session) {
    stopRemoteLiveSync?.();
    stopRemoteLiveSync = null;
    onboardingState = "login";
    onboardingUserId = null;
    if (mode !== "reset" && mode !== "update-password") mode = "login";
    render();
  } else if (mode !== "update-password") {
    void routeAuthenticatedUser(session);
  }
});

render();
const splash = document.getElementById("splash-screen");
if (splash) {
  window.setTimeout(() => {
    splash.classList.add("fade-out");
    window.setTimeout(() => splash.remove(), 600);
  }, 650);
}

const initial = await supabase.auth.getSession();
if (initial.error) {
  setNotice(humanAuthError(initial.error), "error");
} else {
  currentSession = initial.data.session;
  if (currentSession) {
    void routeAuthenticatedUser(currentSession);
  } else {
    onboardingState = "login";
    render();
  }
}

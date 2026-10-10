# GYMFlow — Easy Login + Safer Legacy Import (Stage E)

This update keeps the existing HTML/CSS/Vanilla JS dashboard UI and simplifies the first-login flow.

## User experience

1. The user enters email/password and clicks **Masuk**.
2. If the account already has data in Supabase or a completed import, GYMFlow opens the dashboard automatically. The browser's old LocalStorage is not imported into an account that already has its own server data.
3. If the account has no server progress and no meaningful local legacy progress, GYMFlow opens the dashboard automatically.
4. If the account is empty but this exact browser origin has old progress, the user sees two choices:
   - **Pindahkan progress lama** — opens an import preview. The primary import button downloads a backup and then imports in one click after the user acknowledges the old weight-unit assumption.
   - **Mulai baru di akun ini** — keeps LocalStorage intact and loads only this signed-in account's Supabase state.
5. Exact blank numeric values in old workout sets are normalized on a detached copy (not in LocalStorage): blank reps/weight in history become `null`; blank/missing routine target reps/weight become `0`. Other validation problems still block import and must not be ignored.

## Install option A: You already installed the Stage E frontend

Back up/commit the current project, then replace only:
- `auth.js`
- `auth.css`
- `dataAccess.js`
- `script.js`
- `liveSync.js` (new)

Do not replace `supabaseClient.js` with credentials from another project; preserve your own project URL and publishable key.

## Install option B: You applied Stage E SQL, but have not copied the Stage E frontend yet

1. Make a backup/commit of the current GYMFlow project.
2. Copy these files from the frontend package into the root of the project:
   - `index.html`
   - `auth.js`
   - `auth.css`
   - `dataAccess.js`
   - `script.js`
   - `liveSync.js`
   - `style.css`
   - `new_logo.png`, `new_logoprofile.png`, `logo_newwm.jpg`
3. Keep your existing `supabaseClient.js`; never overwrite it with a different project's config.
4. Check `index.html` loads `auth.css` and `style.css`, and uses `<script type="module" src="auth.js"></script>` at the bottom. Do not also load `script.js` statically.

## Testing

- Run using VS Code Live Server at the origin you configured in Supabase Auth (for example `http://localhost:5500`).
- Returning account with server progress should enter the dashboard after login.
- New account without local progress should enter the dashboard after login.
- Empty account with legacy progress on this origin should see the two choices and must not import until the user chooses it.
- Choose “Mulai baru” and confirm that legacy LocalStorage keys are still present and the loaded dashboard contains only the current account's server state.
- In the import path, verify preview counts, check the weight-unit acknowledgement, click “Backup & pindahkan progress”, and confirm the file downloads and the import is reported complete.
- Test two separate accounts to ensure their server data do not mix.

## Safety / limits

- Stage E SQL functions must already be installed and verified. This is a frontend-only update; **do not run SQL migrations again**.
- No `localStorage.clear()` or legacy-key deletion is performed.
- LocalStorage cannot be read across domains, browsers, or devices. A backup must be exported from the origin/device that contains the old data.
- Static checks and JavaScript syntax checks pass, but the browser + live Supabase end-to-end flow must be tested in your project before deploying to the main domain.


## Final hardening patch

The audited build uses `liveSync.js` for Supabase Realtime updates plus an authenticated RPC polling fallback. It also refreshes dashboard views when safe to do so and defers remote updates while a modal/input or an unsaved write is active. Keep `liveSync.js` beside `auth.js` and `dataAccess.js`. The backend's `supabase_realtime` publication and RLS policies still need to be verified in your own Supabase project; see `supabase-verification.sql` and `AUDIT-REPORT.md`.

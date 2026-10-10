from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
auth = (ROOT / "auth.js").read_text(encoding="utf-8")
script = (ROOT / "script.js").read_text(encoding="utf-8")
live = (ROOT / "liveSync.js").read_text(encoding="utf-8")
client = (ROOT / "supabaseClient.js").read_text(encoding="utf-8")

assert 'import { startRemoteLiveSync } from "./liveSync.js"' in auth
assert '.on("postgres_changes", { event: "*", schema: "public" }' in live
assert "setInterval" in live and "fetchState" in live, "polling fallback is required"
assert "pendingRemoteChange = true" in live, "remote changes must be deferred during local editing"
assert "window.__GYMFLOW_CAN_APPLY_REMOTE_STATE" in script
assert "window.__GYMFLOW_APPLY_REMOTE_STATE" in script
assert 'data-id="${esc(r.id)}"' in script
assert 'data-id="${esc(s.id)}"' in script
assert '${esc(dateStr)}' in script
assert "localStorage.clear(" not in auth + script
assert "service_role" not in client.lower() + auth.lower() + script.lower()
assert "sb_publishable_" in client, "frontend must use a publishable key, not a service role secret"
print("Hardening static checks passed.")

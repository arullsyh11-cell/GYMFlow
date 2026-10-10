from pathlib import Path
import re
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]

class IndexParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.styles = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("src"):
            self.scripts.append((attrs["src"], attrs.get("type")))
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.styles.append(attrs.get("href"))

parser = IndexParser()
parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
assert ("auth.js", "module") in parser.scripts, "index.html must start with auth.js as a module"
assert not any(src == "script.js" for src, _ in parser.scripts), "script.js must be loaded only after remote state is retrieved"
assert "auth.css" in parser.styles and "style.css" in parser.styles, "both existing and auth styles must load"

script = (ROOT / "script.js").read_text(encoding="utf-8")
assert "window.__GYMFLOW_REMOTE_STATE" in script, "dashboard must accept the remote state before initialization"
assert "window.__GYMFLOW_QUEUE_SAVE(snapshot)" in script, "save() must use the remote persistence queue in remote mode"
assert "localStorage.setItem(KEY, JSON.stringify(state))" in script, "legacy local mode must remain supported outside remote mode"
assert "window.__GYMFLOW_APP_READY = true" in script, "dynamic loader readiness handshake is missing"

auth = (ROOT / "auth.js").read_text(encoding="utf-8")
assert 'id="gf-auth-open-dashboard"' in auth, "auth screen must contain the dashboard entry button"
assert 'supabase.rpc("gymflow_get_state")' in (ROOT / "dataAccess.js").read_text(encoding="utf-8")
assert '"gymflow_save_state"' in (ROOT / "dataAccess.js").read_text(encoding="utf-8")

sql_path = ROOT / "supabase/migrations/20261011100000_gymflow_remote_runtime.sql"
if sql_path.exists():
    sql = sql_path.read_text(encoding="utf-8")
    for marker in ["function public.gymflow_session_to_json", "function public.gymflow_get_state()", "function public.gymflow_save_state(p_state jsonb)", "auth.uid()", "revoke all on function public.gymflow_save_state(jsonb) from public, anon", "grant execute on function public.gymflow_save_state(jsonb) to authenticated"]:
        assert marker in sql, f"missing SQL marker: {marker}"
    assert sql.rstrip().endswith("commit;"), "migration must finish with COMMIT"
    print("Stage E SQL source checks passed.")
else:
    print("SKIP SQL source checks: migration file is not included in this frontend ZIP. Run supabase-verification.sql against the existing project.")
print("Stage E frontend static checks passed.")

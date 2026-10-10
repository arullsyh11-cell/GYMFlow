from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
auth = (ROOT / "auth.js").read_text(encoding="utf-8")
css = (ROOT / "auth.css").read_text(encoding="utf-8")
assert 'async function routeAuthenticatedUser(session)' in auth
assert 'alreadyHasAccountData' in auth
assert 'onboardingState = "choice"' in auth
assert 'Pindahkan progress lama' in auth
assert 'Mulai baru di akun ini' in auth
assert 'normalizeLegacyPayload(source)' in auth
assert 'async function openDashboard(options = {})' in auth
assert 'gf-onboarding-choice' in css
assert 'localStorage.clear(' not in auth
assert 'localStorage.removeItem("gymflow-v3")' not in auth
assert 'Backup & pindahkan progress' in auth
print("Easy Login static checks passed.")

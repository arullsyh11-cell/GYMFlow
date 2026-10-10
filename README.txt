GYMFLOW LEGACY SITE — BACKUP EXPORT PATCH

Purpose
- Adds a button in Profile & Target > Data & Storage to download a JSON backup of localStorage keys gymflow-v3, gymflow-v2, and gymflow-v1.
- The exporter only reads these keys. It does not edit or delete them.
- The backup format is compatible with the Stage D importer's localStorage-map format.

Files
- index.html
- script.js
- style.css

How to deploy safely
1. Make a backup/commit of your existing live-site source first.
2. Replace these three source files in the original GYMFlow site project with the files in this folder.
3. Keep your existing image/assets files and their paths unchanged.
4. Redeploy to the SAME domain/origin as the old GYMFlow site.
5. Open the deployed site using the browser/device where workout progress exists.
6. Open Profile & Target > Data & Storage > Unduh Backup Progress (JSON).
7. Keep the JSON file private. Then open the new Stage D app and use “Pilih backup JSON dari browser lama”.

Important
- Do not deploy the Stage C/D auth-only index.html over the old website until backup/export is available on the old origin.
- LocalStorage is tied to browser origin and device. Different browser profiles/devices may have different data; each one must export its own backup.
- This patch does not upload data anywhere; the browser downloads a local JSON file only.

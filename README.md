# GYMFlow — Final Hardening Build

Build frontend hasil audit berdasarkan paket migrasi yang diunggah. UI HTML/CSS/Vanilla JS dipertahankan.

## File penting
- `auth.js`, `auth.css`: autentikasi dan alur impor backup LocalStorage lama.
- `dataAccess.js`: load state dan antrean penyimpanan Supabase.
- `liveSync.js`: sinkronisasi Supabase Realtime dengan fallback pemeriksaan state via RPC.
- `script.js`: dashboard, penyimpanan ke Supabase saat remote mode, dan runtime bridge untuk menerima state terbaru.
- `supabaseClient.js`: konfigurasi Supabase khusus project. Pertahankan URL dan publishable key milik project Anda.
- `AUDIT-REPORT.md`: perubahan, hasil tes, dan batas audit.
- `supabase-verification.sql`: query baca-saja untuk memverifikasi RLS, policy, grants fungsi RPC, dan publikasi Realtime.

## Pemasangan
1. Buat backup/commit project dan backup JSON progress pengguna sebelum mengganti file.
2. Ganti `auth.js`, `auth.css`, `dataAccess.js`, `script.js`, dan tambahkan `liveSync.js`. Pertahankan `supabaseClient.js` yang terkonfigurasi benar untuk project Anda. Pertahankan `index.html`, `style.css`, dan assets yang sudah dipakai kecuali Anda memang menyamakan seluruh paket.
3. Jangan jalankan ulang migration SQL yang sudah diterapkan.
4. Jalankan dengan origin yang terdaftar di Supabase Auth, lalu login.
5. Tes sinkronisasi dua perangkat dan jalankan query verifikasi database sebelum menyatakan backend selesai diaudit.

## Tes lokal
Jalankan dari folder ini:
```sh
node --check auth.js
node --check dataAccess.js
node --check liveSync.js
node --check script.js
node tests/validate_import.smoke.mjs
node tests/live-sync-smoke.mjs
python tests/easy-login-static-checks.py
python tests/stage-e-static-checks.py
python tests/hardening-static-checks.py
```

Semua script tes di atas adalah syntax/static/smoke checks. Mereka tidak menggantikan browser end-to-end test pada project Supabase Anda.

# GYMFlow — Audit Tahap 1 sampai Final Hardening

## Ringkasan

Paket ini mempertahankan dashboard HTML/CSS/JavaScript yang sudah ada dan konfigurasi Supabase milik project. Tidak ada perubahan skema database yang dijalankan dari paket ini.

## Perubahan pada frontend

1. **Sinkronisasi lintas perangkat diperjelas di source.** `liveSync.js` mendengarkan Supabase Postgres Changes pada schema `public` dan menjalankan fallback pembacaan `gymflow_get_state` setiap 12 detik saat halaman terlihat. Saat tab kembali aktif atau jaringan pulih, aplikasi juga melakukan pemeriksaan.
2. **Perlindungan saat ada edit lokal.** State dari perangkat lain ditunda ketika ada request penyimpanan yang belum selesai, penyimpanan berstatus error, modal terbuka, atau input sedang digunakan. Setelah penyimpanan lokal selesai, pembaruan yang tertunda diperiksa kembali.
3. **Render ulang state dari server.** `script.js` menambahkan bridge runtime agar state terbaru dapat dimuat dan dashboard, exercises, routines, workout, history, weight history, dan analytics diperbarui tanpa reload halaman.
4. **Hardening output HTML.** ID routine, ID sesi, dan string tanggal yang masuk ke template HTML di-escape agar nilai data tidak dapat memecah atribut HTML secara langsung.
5. **Pengujian diperbarui.** Ditambahkan smoke test untuk sinkronisasi, perlindungan edit, retry pembaruan tertunda, dan cleanup channel. Tes Stage E kini secara eksplisit melewati pemeriksaan sumber SQL jika migration file memang tidak ada pada paket frontend, bukan mengklaim SQL sudah teruji.

## Pengujian yang dijalankan

- `node --check auth.js` — lulus.
- `node --check dataAccess.js` — lulus.
- `node --check liveSync.js` — lulus.
- `node --check script.js` — lulus sebagai classic browser script.
- `node tests/validate_import.smoke.mjs` — lulus.
- `node tests/live-sync-smoke.mjs` — lulus.
- `python tests/easy-login-static-checks.py` — lulus.
- `python tests/stage-e-static-checks.py` — pemeriksaan frontend lulus; pemeriksaan SQL di-skip karena file migration tidak disertakan.
- `python tests/hardening-static-checks.py` — lulus.

Ini adalah syntax dan smoke tests berbasis kode, bukan browser end-to-end test terhadap project Supabase milik pengguna.

## Batas audit yang masih penting

1. **Source migration database tidak ada di ZIP yang dikirim.** Karena itu, isi fungsi RPC, RLS policies, grants, dan konfigurasi publication tidak bisa diverifikasi dari source pada paket ini. Jalankan query read-only pada `supabase-verification.sql` dan tinjau hasilnya sebelum menyatakan audit backend selesai.
2. **Realtime bergantung konfigurasi Supabase.** Jika tabel belum diaktifkan untuk Postgres Changes, fallback polling tetap akan memuat state terbaru, tetapi pembaruan dapat tertunda sampai interval berikutnya. Pastikan RLS aktif pada seluruh tabel `public` yang terekspos sebelum memakai listener schema-wide.
3. **Edit serentak dua perangkat belum dijamin bebas konflik.** `gymflow_save_state` menyimpan keseluruhan snapshot state. Sinkronisasi mengurangi peluang state lama bertahan, tetapi tanpa mekanisme optimistic locking/versi di fungsi database, dua perangkat yang menulis secara bersamaan masih berpotensi menimpa perubahan satu sama lain. Jangan anggap kasus race ini selesai hanya berdasarkan tes berurutan di dua device.
4. **Backup lama tetap harus dipertahankan.** Perubahan ini tidak memanggil `localStorage.clear()` atau menghapus key progress lama.
5. **Foto profil lama perlu konfirmasi tersendiri.** File backup lama memuat kemungkinan field `profilePhoto`, tetapi paket ini tidak membuktikan bahwa RPC/schema server menyimpan field tersebut. Jangan menganggap foto profil pasti tersinkron ke device lain.
6. **Jangan menjalankan migration SQL ulang.** Query SQL yang disertakan bersifat baca-saja; gunakan hasilnya untuk audit sebelum menyiapkan perubahan database terpisah.

## Tes manual setelah mengganti file

1. Backup/commit project aktif.
2. Salin file hasil paket ke project; jangan mengubah `SUPABASE_URL` atau publishable key project yang sudah benar.
3. Jalankan melalui origin yang diizinkan di Supabase Auth.
4. Login dengan akun yang sama di dua perangkat. Buat workout pada device A dan verifikasi perubahan muncul pada device B tanpa reload. Tes lagi dengan Realtime nonaktif atau jaringan terputus sebentar untuk memastikan fallback/pemulihan bekerja.
5. Saat device B sedang mengedit input atau modal, ubah data dari device A. Pastikan formulir B tidak tiba-tiba tertimpa; setelah perubahan B selesai, cek hasil akhir pada kedua perangkat.
6. Jalankan `supabase-verification.sql` untuk meninjau seluruh RLS policies, fungsi, hak execute, dan publication. Pastikan akun A tidak dapat membaca atau menulis data akun B.

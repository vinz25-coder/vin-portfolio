# Changelog Guestbook

## 2026-09-03

- Menambahkan halaman `/guestbook` bilingual dengan layout editorial responsif, rating overview, composer, filter, sort, threaded feed, sidebar statistik, contributor, dan community guidelines.
- Mengganti preview Discussion `Coming Soon` dengan link Guestbook dari floating control dan menu mobile.
- Menambahkan Google Auth contract, post Discussion/Review, rating 1-5, emoji, gambar, mention, reply dua tingkat, multi-reaction, edit, tombstone delete, report, dan kontrol owner inline.
- Menambahkan Supabase migration untuk schema, constraint, index, trigger profil Google, RLS, Storage policy, aggregate RPC, dan mutation RPC.
- Menambahkan endpoint visitor anonim berbasis HMAC, owner verification, dan owner moderation.
- Menambahkan environment contract dan dependency `@supabase/supabase-js`.
- Memperbarui test route/navigation Guestbook serta menambahkan test endpoint visitor, owner, dan moderation.
- Mengubah floating trigger menjadi preview Discussions/Reviews dengan data terbaru dan CTA menuju halaman penuh.
- Memperbaiki logo serta navigasi section pada `/guestbook` agar kembali ke Hero dan anchor Home yang sesuai.
- Menyederhanakan hamburger menu menjadi navigasi tanpa preview dan social links, serta menambahkan active marker Guestbook pada route `/guestbook`.
- Verifikasi baseline: typecheck, lint, 62 test, dan production build lulus.

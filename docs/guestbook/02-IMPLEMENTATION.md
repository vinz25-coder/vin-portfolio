# Rencana Implementasi Guestbook

**Status:** Disetujui untuk implementasi pada 2026-09-03

## Arsitektur

- Tambahkan route `/guestbook` memakai shell global yang sudah ada.
- Gunakan `@supabase/supabase-js` untuk Google Auth, query database, mutation, dan Storage.
- Guestbook tetap dapat merender signed-out dan empty state jika environment Supabase belum dipasang; aksi backend memberi status konfigurasi yang eksplisit.
- Simpan state filter, sort, pagination, composer, dan dialog secara lokal pada feature Guestbook.
- Floating chat desktop/tablet pada route selain `/guestbook` membuka preview Discussions/Reviews dan CTA menavigasi ke `/guestbook`; seluruh widget tidak dirender pada halaman Guestbook.
- Item Guestbook pada hamburger menu menavigasi langsung ke `/guestbook`, memakai `aria-current` serta active treatment saat route current, dan drawer tidak memuat social links.
- Header route-aware memakai `/#home`, `/#about`, `/#skills`, dan `/#experience` saat dirender di luar Home.

## Data dan Database

- Migration membuat enum, `profiles`, `guestbook_entries`, `guestbook_reactions`, `guestbook_mentions`, `guestbook_reports`, dan `guestbook_visits`.
- Trigger menyinkronkan profil Google serta menjaga `updated_at`.
- Constraint database menerapkan jenis post, rating, depth, panjang body, reaction type, dan report uniqueness.
- RLS memisahkan public read, authenticated ownership, dan mutation yang diizinkan.
- RPC menyediakan paginated root feed beserta thread, rating summary, statistics, contributor ranking, reaction toggle, serta entry mutation.
- Bucket `guestbook-images` menerima JPEG/PNG/WebP maksimal 5 MB pada folder user sendiri.

## Server

- `POST /api/guestbook/visitor` memvalidasi browser ID, membuat HMAC dengan secret server, dan mencatat kunjungan tanpa IP.
- `POST /api/guestbook/moderate` memvalidasi access token, mencocokkan UUID dengan `GUESTBOOK_OWNER_USER_IDS`, lalu menjalankan pin/hide/delete memakai service role.
- Service role, owner UUID, dan hash secret tidak pernah dikirim ke browser.

## UI

- `GuestbookPage` menangani route title, scroll, header, Footer, dan social rail.
- Feature root memuat auth, summary, composer, filters, feed, contributors, statistics, guidelines, dan dialogs.
- Heading Guestbook memakai copy terstruktur untuk memberi aksen tema pada kata terakhir beserta titik tanpa memecah string saat render.
- Preview memakai header ringkas, tab berindikator garis, waktu relatif bilingual, ringkasan rating pada tab Reviews, maksimal tiga entri terbaru, dan footer CTA terpisah.
- Feed dirender sebagai semantic article tree dengan rail visual maksimal dua tingkat reply.
- Composer yang sama dipakai untuk create dan edit; reply tetap dekat dengan target thread.
- Emoji memakai daftar kecil native; mention memakai autocomplete participant tanpa dependency baru.
- Upload menampilkan preview, validasi MIME/size, dan remove sebelum submit.

## Environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GUESTBOOK_OWNER_USER_IDS=
GUESTBOOK_VISITOR_HASH_SECRET=
```

Google provider, OAuth redirect URL, dan Storage bucket dikonfigurasi pada Supabase Dashboard setelah project dibuat.

## Verifikasi

- Test route dan integrasi widget/navigation.
- Test empty/configuration state, filter/sort, character count, rating requirement, upload validation, reaction, reply depth, report, edit/delete, dan owner controls.
- Test endpoint visitor dan moderation boundary.
- Periksa keyboard, focus, live region, axe, ID/EN, light/dark, reduced motion, dan overflow breakpoint utama.
- Jalankan `npm run typecheck`, `npm run lint`, `npx vitest run`, dan `npm run build`.

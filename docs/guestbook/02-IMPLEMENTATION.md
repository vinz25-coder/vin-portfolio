# Rencana Implementasi Guestbook

**Status:** Baseline disetujui pada 2026-09-03; revisi 2026-09-05 disetujui eksplisit dan diimplementasikan lokal. Seluruh open item spec diselesaikan; deployment dan verifikasi database/browser manual belum dilakukan.

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
- RPC authenticated memastikan profile dari metadata Google tersedia sebelum mutation dan active Review RPC mengembalikan JSON valid atau `null`.
- Constraint database menerapkan jenis post, rating, depth, panjang body, reaction type, dan report uniqueness.
- Partial unique index membatasi satu Review root aktif per author; trigger menjaga jenis entry tetap immutable setelah insert.
- RPC community summary menghitung root Discussion/Review visible serta average rating tanpa reply, hidden, atau deleted content.
- Tabel reaction portfolio privat menyimpan satu row per akun dan jenis emoji; summary publik hanya mengekspos aggregate, sedangkan toggle memerlukan auth.
- Reaction entry dibatasi pada Like/Dislike yang saling menggantikan; migration membersihkan reaction lama dan Popular hanya menghitung Like beserta reply.
- Migration moderasi menambahkan status visible/pending/quarantined, blocked users privat, ledger rate-limit privat, normalisasi body, pemeriksaan duplikasi/URL/pengulangan, self-report guard, dan auto-quarantine setelah tiga reporter unik.
- Tabel push subscription dan delivery log hanya diakses service role; target reply disimpan sebelum normalisasi depth agar nested reply tetap menotifikasi recipient yang benar.
- RLS memisahkan public read, authenticated ownership, dan mutation yang diizinkan.
- RPC menyediakan paginated root feed beserta thread, rating summary, statistics, contributor ranking, reaction toggle, serta entry mutation; client memakai overfetch satu row dan offset batch tetap untuk menentukan continuation secara akurat.
- Bucket `guestbook-images` menerima JPEG/PNG/WebP maksimal 5 MB pada folder user sendiri.

### Kontrak Migration Revisi

- Buat migration Supabase baru; jangan mengubah migration yang sudah diterapkan atau menghapus tabel mention lama.
- Simpan kategori Review sebagai array berisi satu sampai enam nilai unik dan terurut sesuai enam nilai stabil pada spec; backfill seluruh root Review lama menjadi `[portfolio]`. Constraint memastikan root Review memiliki kategori valid dan Discussion/reply tidak memilikinya, termasuk konsistensi saat tombstone dibuat.
- Perbarui `create_guestbook_entry`, `update_guestbook_entry`, `guestbook_feed`, dan RPC active Review beserta parser/type client agar membawa seluruh kategori. Create memakai default Portfolio; edit mempertahankan kategori. Partial unique index satu Review aktif per akun tetap lintas kategori, termasuk hidden Review.
- Aggregate average/distribusi dan Highest Rated tidak diberi pembatas kategori. Feed dan payload preview membawa kategori untuk label dinamis.
- Tambahkan metadata deletion source bernilai `commenter` atau `site_author`; entry belum dihapus tidak memiliki source. Backfill tombstone lama sebagai `commenter` sesuai keputusan spec.
- `tombstone_guestbook_entry` mencatat `commenter`; jalur soft-delete moderation API mencatat `site_author`. Feed mengembalikan source tanpa UUID pelaku, termasuk payload untuk preview.
- Composer/client baru tidak mengirim mention ID; sesuaikan kontrak create/update tanpa penghapusan destruktif tabel lama. Teks `@nama` tidak diparse sebagai mention atau target push.
- Tambahkan function SQL permanent subtree delete yang hanya dapat dieksekusi service role; revoke akses PUBLIC, anon, dan authenticated secara eksplisit. Validasi target dan kumpulkan semua `image_path` subtree sebelum delete dalam transaksi yang sama.
- Hapus descendant terdalam lebih dahulu, lalu reply parent, lalu target/root terakhir agar foreign key `parent_id`/`root_id` dengan `ON DELETE RESTRICT` tetap dipenuhi. Subtree hanya relasi `parent_id` tersimpan, termasuk hidden/tombstone; sibling hasil normalisasi depth tidak termasuk. Function mengambil table write lock selama pengumpulan authoritative path/ID dan delete untuk mencegah concurrent mutation mengubah cakupan.
- Reactions, mentions, reports, dan push delivery terkait dihapus melalui foreign key cascade. Kembalikan daftar image path authoritative ke moderation API untuk cleanup Storage; jangan menerima daftar path dari client.

## Server

- `POST /api/guestbook/visitor` memvalidasi browser ID, membuat HMAC dengan secret server, dan mencatat kunjungan tanpa IP.
- `GET /api/guestbook/moderate` memvalidasi owner yang sama lalu mengembalikan konten pending/quarantined untuk mode moderasi inline.
- `POST /api/guestbook/moderate` memvalidasi access token, mencocokkan UUID dengan `GUESTBOOK_OWNER_USER_IDS`, lalu menjalankan pin/approve/hide/unhide/soft delete/block atau action terpisah `permanent_delete` memakai service role; target block selalu diturunkan dari entry authoritative.
- Tambahkan `permanent_delete` ke action parser dan `ModerationAction` client. Tolak non-owner sebelum RPC; ownership entry sendiri tidak menggantikan verifikasi owner server.
- Permanent delete memanggil function transaksional lalu membersihkan seluruh image path hasil RPC pada bucket `guestbook-images`. Transaksi SQL tidak mencakup Storage: kegagalan cleanup harus dilaporkan sebagai cleanup gagal, bukan klaim rollback database atau sukses penuh; UI tetap merekonsiliasi data yang sudah terhapus.
- Service role, owner UUID, dan hash secret tidak pernah dikirim ke browser.

## UI

- `GuestbookPage` menangani route title, scroll, header, Footer, dan social rail.
- Feature root memuat auth, summary, composer, filters, feed, contributors, statistics, guidelines, dan dialogs.
- Heading Guestbook memakai copy terstruktur untuk memberi aksen tema pada kata terakhir beserta titik tanpa memecah string saat render.
- Di `src/components/guestbook/Guestbook.tsx`, turunkan heading clamp menjadi sekitar `clamp(2.75rem,8vw,6.5rem)`; pertahankan properti tipografi dan struktur lainnya.
- Preview memakai header ringkas, tab berindikator garis, waktu relatif bilingual, ringkasan rating pada tab Reviews, maksimal tiga entri terbaru, dan footer CTA terpisah.
- Feed dirender sebagai semantic article tree dengan rail visual maksimal dua tingkat reply.
- Status akun author ditampilkan setelah verifikasi server; mode moderasi inline hanya tersedia bagi author dan tidak mengubah feed publik.
- Menu aksi memakai stacking aktif, arah buka yang aman, click-outside, Escape, dan focus management agar kontrol moderasi tidak tertutup entry lain.
- Composer yang sama dipakai untuk create dan edit; reply tetap dekat dengan target thread.
- Main composer menerima identitas session, status Author, Sign out, dan kontrol notifikasi pada header form; tidak ada bar akun terpisah di antara Reaction dan form.
- Shortcut edit Review mengambil ulang target authoritative sebelum dialog dibuka; parser menolak payload all-null/malformed dan dialog menampilkan error mutation secara lokal.
- Track distribusi rating memakai ketebalan dan kontras yang tetap terbaca saat persentase aktual tersedia.
- Dependency `emoji-picker-react` disetujui dan ditambahkan. `React.lazy` memakai dynamic import ketika picker dibuka; UI/data picker tidak masuk initial bundle Guestbook secara langsung. Verifikasi pemisahan chunk pada build.
- Di `GuestbookComposer.tsx`, pertahankan trigger kecil Add emoji, sediakan search/katalog penuh, loading state, tema mengikuti context aktif, dan lebar dibatasi viewport mobile. Simpan selection textarea sebelum trigger mengambil fokus, sisipkan emoji pada caret atau ganti selection tanpa melewati batas body, lalu pulihkan caret/fokus.
- Tutup picker setelah pemilihan, Escape, dan outside click; kembalikan fokus ke textarea. Hapus tombol `@`, popup/state mention, prop participant, serta pengumpulan participants yang hanya dipakai toolbar.
- Hapus guideline mention dari kedua locale; manual `@nama` tetap plain text. Direct reply tetap satu-satunya pemicu Web Push; tidak menambahkan email notification.
- Tambahkan checkbox-chip multi-select kategori hanya untuk Review, default `portfolio`, dengan enam label bilingual sesuai spec. Pertahankan seluruh kategori saat edit dan tampilkan seluruh label di `GuestbookEntry` serta floating preview.
- Upload menampilkan preview, validasi MIME/size, dan remove sebelum submit.
- Main composer menyimpan draft teks, tipe, rating, dan kategori di localStorage; draft lama tanpa kategori memakai Portfolio saat Review. Draft dibersihkan setelah publish berhasil; Discussion/reply mengirim kategori null, bukan nilai Review yang tersisa di state.
- Rating memakai radio group bilingual dan Review aktif milik user diarahkan ke flow edit, bukan membuat duplikat.
- Feed memisahkan pinned content dari hasil sort reguler, menampilkan reply count/context, tanggal absolut, dan deep-link target.
- Root feed menampilkan sepuluh item per batch dan append halaman berikutnya; reply dilipat tiga per thread serta dibuka tiga per aksi, dengan auto-expand untuk deep link.
- Lookup Review aktif mengabaikan hasil session lama dan disinkronkan setelah create, edit, hide, unhide, delete, serta duplicate response; hidden Review tetap menahan slot dengan status moderasi yang eksplisit.
- Reaction portfolio tampil terpisah di bawah rating overview dengan lima emoji dalam satu bar horizontal, count, pressed state, dan toggle authenticated tanpa me-refresh feed.
- Pisahkan `.guestbook-reaction` dari selector active reaction portfolio di `src/index.css`. Gunakan inline-flex, items-center, gap kecil, ukuran compact tetap, dan border transparan bila diperlukan; active background memakai `color-mix()` tipis dari `--color-accent-500` tanpa border/ring/glow/scale/lift. Pertahankan keyboard focus outline serta `aria-pressed`; jangan ubah style portfolio reaction.
- Render tombstone berdasarkan deletion source pada main feed dan floating preview; jangan render body, rating, image, reaction, atau kontrol publik. Pengecualian disetujui: menu owner-only dengan satu action permanent delete pada existing tombstone. Moderation queue juga memuat tombstone agar yang hidden tetap dapat dihapus.
- Kontrol permanent delete hanya untuk owner terverifikasi server, termasuk entry miliknya sendiri; tampilkan dialog konfirmasi irreversible physical subtree delete sesuai copy bilingual spec. Setelah mutation berhasil, refresh feed, moderation queue, rating summary, filter count, dan active Review state tanpa menerima respons refresh usang.
- Filter menampilkan jumlah root All Comments, Discussions, dan Reviews; reply count tetap berada pada thread terkait.
- UI publik tidak menampilkan contributor ranking; statistik visitor dimuat secara non-esensial agar kegagalannya tidak menggagalkan feed.
- Sidebar menampilkan Total Visitors, Today Visitors, dan Average Rating; akun login mendapat kontrol enable/disable Web Push per browser tanpa inbox atau polling.
- Render satu sidebar setelah Rating/Reaction dan sebelum composer/sign-in serta filters/feed, dengan `mt-6` pada lebar <1280px. Pada `xl`, tempatkan Rating/Reaction di kolom 1 baris 1, composer/feed di kolom 1 baris 2, dan sidebar sticky self-start di kolom 2 membentang dua baris; gunakan baris `min-content 1fr`, tanpa gap vertikal, dan reset margin sidebar agar spacing desktop tetap sama.
- Setelah RPC create reply berhasil, client meminta Vercel Function mengirim push. Function memverifikasi token, kepemilikan reply, recipient, visibility, deduplikasi delivery, dan VAPID config sebelum mengirim.
- Client dan Function hanya memproses push untuk reply berstatus visible; pending/quarantined reply tidak mengirim notification.
- Service worker menerima push saat portfolio tertutup dan notification click membuka deep link entry yang sudah ada.

## Environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GUESTBOOK_OWNER_USER_IDS=
GUESTBOOK_VISITOR_HASH_SECRET=
VITE_WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=
WEB_PUSH_SUBJECT=mailto:evindoamandariza@gmail.com
```

Google provider, OAuth redirect URL, dan Storage bucket dikonfigurasi pada Supabase Dashboard setelah project dibuat.
VAPID key pair dibuat satu kali; public key tersedia bagi browser, sedangkan private key hanya disimpan pada environment server lokal dan Vercel.

## Verifikasi

- Test route dan integrasi widget/navigation.
- Test empty/configuration state, filter/sort/count, character count, rating requirement, upload validation, reaction portfolio, Like/Dislike, Popular, reply depth, report, edit/delete, dan owner controls.
- Test endpoint visitor dan moderation boundary.
- Composer: picker terbuka, search tersedia, pemilihan pada caret/selection, batas karakter, Escape/outside click dan pemulihan fokus, tidak ada tombol mention, serta kategori default/draft lama/draft baru/edit.
- Entry/preview: enam label kategori, kedua tombstone copy dan konten tersembunyi, vote aktif compact, serta kontrol permanent delete owner termasuk entry sendiri dan confirmation/cancel.
- API: action parsing, owner-only permanent delete, penolakan non-owner, pemanggilan subtree RPC, cleanup seluruh image path, dan kegagalan Storage setelah database delete.
- Migration contract: kategori wajib hanya pada root Review, backfill Portfolio, deletion source/backfill, payload RPC, function service-role-only, urutan descendant-parent-root, dan cascade terkait. Verifikasi database subtree dengan reply bertingkat/hidden setelah persetujuan implementasi, bukan hanya pencocokan teks SQL.
- Regression: satu active Review lintas kategori termasuk hidden, rating summary/distribusi/Highest Rated lintas kategori, Web Push hanya direct reply, pagination, moderation, serta reaction portfolio tidak berubah.
- Periksa keyboard, focus, live region, axe, ID/EN, light/dark, reduced motion, dan overflow breakpoint utama.
- Periksa manual picker mobile portrait/landscape, tema saat picker terbuka, dan confirmation permanent delete pada kedua bahasa/tema.
- Jalankan `npm run typecheck`, `npm run lint`, full `npx vitest run`, `npm run build`, Prettier check pada file yang berubah, dan `git diff --check`. Catat pemeriksaan yang belum dapat dijalankan; jangan mengklaim verifikasi browser/database dari unit test saja.

## Urutan Revisi

1. Persetujuan revisi kedua dokumen, dependency, copy, dan open item spec selesai berdasarkan instruksi eksplisit user.
2. Implementasikan migration dan kontrak data/API, lalu verifikasi kategori, provenance, otorisasi, subtree, serta cleanup Storage.
3. Implementasikan heading, penghapusan mention UI, full emoji picker, kategori/draft/edit, tombstone, permanent delete, dan style vote tanpa mengubah section lain.
4. Jalankan seluruh quality gate dan pemeriksaan manual, presentasikan hasil review, lalu perbarui changelog setelah revisi implementasi selesai dan disetujui.

## Catatan Implementasi

- Migration awal kategori berada di `202609050003_guestbook_approved_revision.sql`; migration lanjutan non-destruktif memakai `202609050004_guestbook_review_categories.sql`. Active Review dan feed membawa array kategori tanpa payload mention.
- Permanent-delete API mengembalikan `deletedIds` authoritative. UI membuang ID tersebut dan membatalkan hasil read lama sebelum refresh feed/queue/summary/filter/active Review, termasuk ketika Storage gagal. Cleanup failure mengembalikan `STORAGE_CLEANUP_FAILED`, `deleted: true`, dan path authoritative hanya ke owner untuk tindak lanjut; tidak mengklaim rollback SQL.
- Unit test memakai picker asli dengan mock IntersectionObserver jsdom, bukan mock katalog emoji. Test SQL contract tidak menggantikan eksekusi PostgreSQL nyata.
- Migration lanjutan mengubah kategori Review menjadi `text[]` terurut dan unik, membungkus nilai lama sebagai array, serta mengganti kontrak create/update dengan `p_review_categories text[]`. Composer memakai checkbox-chip multi-select dengan minimal satu pilihan; agregasi rating dan satu active Review tetap dihitung per Review.

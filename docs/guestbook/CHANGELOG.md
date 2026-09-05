# Changelog Guestbook

Catatan bertanggal merekam evolusi implementasi; perubahan terbaru menggantikan perilaku lama. Kontrak aktif ada di `01-SPEC.md`, detail teknis dan cakupan verifikasi di `02-IMPLEMENTATION.md`.

## 2026-09-05

### Fitur dan UI

- Review mendukung 1-6 kategori unik dalam urutan kanonis: `portfolio`, `ui_ux_design`, `code_quality`, `communication`, `collaboration`, dan `overall_experience`. Default/backfill Portfolio, checkbox-chip bilingual, draft lama tanpa kategori atau kategori tunggal, edit, parser/RPC, serta label feed/floating preview ikut diselaraskan. Tetap satu Review aktif per akun termasuk hidden, dengan satu rating per Review; kategori tidak menggandakan slot, count, average, distribusi, atau Highest Rated.
- Mengganti emoji terbatas dengan katalog/search `emoji-picker-react` yang lazy-loaded, mengikuti tema, dibatasi viewport, menyisipkan pada caret/selection tanpa melewati 1.000 karakter, dan mengembalikan fokus setelah pilih/Escape/klik luar. Menghapus tombol, popup, state, payload, dan guideline mention; `@nama` manual tetap teks biasa dan tabel mention lama tidak dihapus.
- Menambahkan permanent subtree delete khusus Author terverifikasi, termasuk entry sendiri dan tombstone, dengan konfirmasi bilingual irreversible. Opsi soft delete redundan dihapus dari UI Author; delete pengunjung tetap tombstone, sedangkan API soft delete Author tetap tersedia.
- Tombstone membedakan `Deleted by commenter` dan `Removed by Author` melalui provenance `commenter`/`site_author` pada feed/preview, tanpa UUID pelaku atau konten/interaksi publik. Mode moderasi turut memuat tombstone; menu tombstone hanya menyediakan permanent delete untuk Author.
- Memperkecil heading menjadi `clamp(2.75rem,8vw,6.5rem)` tanpa mengubah identitas tipografi. Like/Dislike kini compact dengan tint aksen tipis, ukuran tetap, tanpa active border/ring/glow/scale/lift; focus keyboard tetap ada dan style reaction portfolio tidak berubah. Ini menggantikan eksperimen glass/glow vote entry pada 2026-09-04.
- Menuntaskan layout responsif yang disetujui: <1280px mengikuti Rating, Reaction, Community Summary, Community Guidelines, composer/sign-in, lalu filters/feed dalam satu alur dokumen tanpa internal page scroll. >=1280px mempertahankan main feed kiri dan sidebar kanan sticky; satu sidebar dipakai tanpa duplikasi konten.

### Fix dan Integritas

- Permanent delete memakai RPC service-role-only, write lock, subtree berdasarkan `parent_id` tersimpan, dan penghapusan descendant terdalam sebelum parent/root dalam transaksi. Hidden/tombstone ikut terhapus; sibling akibat normalisasi depth tidak ikut. Foreign key cascade membersihkan reactions, mentions, reports, dan push delivery terkait.
- Moderation API membersihkan path gambar authoritative hasil RPC dalam batch maksimal 100. Jika Storage gagal setelah SQL berhasil, respons menyatakan `STORAGE_CLEANUP_FAILED`, `deleted: true`, serta ID/path terkait kepada owner, bukan rollback atau sukses penuh. UI tetap membuang ID terhapus, menolak respons read usang, dan merekonsiliasi feed, queue, summary/count, serta slot Review.
- Integritas yang dipertahankan: nullable/strict active Review lookup, pemulihan profil Google, perlindungan race session dan refresh moderasi, pagination root 10/reply 3, report/rate limit/block, serta lima reaction portfolio terpisah. Detail fix awal tetap pada catatan 2026-09-04.
- Web Push tetap opt-in per browser dan hanya untuk direct reply visible dari user lain pada Discussion/Review, dengan recipient disimpan sebelum normalisasi depth, deduplikasi per reply/subscription, serta cleanup subscription expired. Mention, self-reply, reaction, edit, dan moderasi tidak menambah pemicu push.

### Verifikasi dan Status

- Berdasarkan hasil sesi sebelumnya, migration `202609050003` (kategori awal, provenance, permanent delete) dan `202609050004` (array multi-kategori) berhasil diterapkan ke Supabase tertaut melalui `db push`; dry-run terakhir menyatakan up-to-date. Status lama "migration lokal saja" pada spec/implementation telah diselaraskan; tidak ada push/deployment baru pada pembaruan docs ini.
- Quality gate terakhir pada sesi sebelumnya: 134 test seluruh proyek, lint, typecheck, production build, dan pemeriksaan format lulus. Build masih memberi warning ukuran bundle; picker memakai dynamic import/chunk terpisah. Angka ini bukan jumlah test Guestbook saja atau hasil eksekusi ulang pada perubahan docs ini.
- Tes yang tersedia mencakup composer/draft/kategori/picker, parser active Review/pagination, entry/menu/tombstone/deep link, reaction, permission push, boundary endpoint, otorisasi permanent delete, cleanup sukses/gagal, serta kontrak teks migration. Unit test/mock dan SQL contract tidak membuktikan perilaku PostgreSQL atau browser nyata.
- Browser manual (responsif, keyboard, light/dark, ID/EN, reduced motion, picker, dan konfirmasi), skenario subtree/Storage database end-to-end, deployment endpoint revisi, konfigurasi VAPID, dan delivery push nyata belum terkonfirmasi. Keberhasilan migration tidak berarti seluruh deployment atau pengujian tersebut selesai.

## 2026-09-04

- Menyamakan state aktif Like/Dislike pada entry dengan pill glass Reaction portfolio, termasuk border aksen, inner highlight, glow bertingkat, lift ringan, pasangan light/dark, dan reduced-motion fallback tanpa mengubah lebar action row.
- Memberi ruang internal terkompensasi pada scroller Reaction agar glow tombol aktif tidak terpotong di sisi panel atau memperlihatkan batas shadow berbentuk margin.
- Merampingkan reaction aktif agar tidak melebar berlebihan, mengganti animasi ukuran dengan lift/scale ringan, serta merapatkan border, glass tint, dan glow agar state terasa lebih luwes.
- Memperjelas reaction portfolio aktif sebagai pill glass yang melebar dengan border aksen, inner highlight, glow bertingkat, pasangan light/dark, dan reduced-motion fallback.
- Menambahkan perlindungan moderasi bertingkat: rate limit per akun, normalisasi dan klasifikasi spam deterministik, duplicate-body 24 jam, Pending/Quarantined queue, self-report guard, auto-quarantine tiga report unik, Block user, serta visible-only reply push.
- Memperluas alasan report untuk hate, threat, illegal activity, phishing, dan personal data; menambahkan copy bilingual, feedback submission moderasi, serta kontrol Approve/Hide/Delete/Block inline.
- Menerapkan migration moderasi `202609050001` ke Supabase tertaut dan memverifikasi classifier remote untuk hasil visible, pending, serta quarantined.
- Menerapkan migration Storage `202609050002` agar blocked user tidak dapat upload atau replace media Guestbook, sambil tetap mengizinkan penghapusan media/subscription untuk privasi.
- Verifikasi moderasi akhir lulus pada typecheck, lint, 112 test, Prettier, production build, diff check, dan Supabase dry-run up-to-date.
- Memperbaiki false active Review dari composite RPC all-null dengan parser strict dan RPC JSON nullable authenticated-only; shortcut edit kini mengambil target terbaru dan menampilkan error di dalam modal.
- Menambahkan self-healing serta backfill profile Google, memperbaiki endpoint owner menjadi verified upsert, dan menerapkan migration `202609040005`; anon active-review RPC ditolak, profile owner tersedia, dan active Review remote tetap nol.
- Mengganti pagination root kumulatif dengan batch 10 dan overfetch satu row agar Load More Comments hanya muncul saat root ke-11 tersedia serta tetap bekerja melewati 50 entry.
- Melipat reply menjadi tiga per thread, membuka tiga berikutnya melalui View More Replies, dan otomatis membuka reply target deep link.
- Mengamankan lookup Review aktif terhadap race session/auth, membersihkan state user saat akun berubah, serta menyinkronkan status setelah create, edit, duplicate, hide, unhide, dan delete; hidden Review mendapat penjelasan slot moderasi yang eksplisit.
- Memindahkan identitas akun, status Author, Sign out, dan kontrol notifikasi ke header composer agar hubungan akun dengan posting jelas; menebalkan serta meningkatkan kontras track distribusi rating.
- Menyeimbangkan panel Overall Rating dan Reaction dengan membatasi lebar konten rating, merapatkan distribusi, mengelompokkan reaction tanpa peregangan breakpoint, serta menyamakan tipografi heading uppercase.
- Merapikan reaction portfolio menjadi kelompok horizontal terukur dengan jarak konsisten, count tabular, panel lebih ringkas, dan horizontal scroll tanpa scrollbar pada layar sempit.
- Menyederhanakan reaction portfolio menjadi lima pilihan 👍, ❤️, 🔥, 👏, dan 🚀 dalam satu bar horizontal dengan count di samping emoji; mobile memakai horizontal scroll tanpa grid.
- Menerapkan migration compact `202609040004` untuk menghapus tiga tipe reaction portfolio yang dibatalkan dan membatasi summary/toggle remote pada lima tipe final.
- Menambahkan reaction portfolio authenticated berupa 👍, ❤️, 🔥, 👋, 🚀, ✨, 😊, dan 💯 dengan count publik, toggle per akun, pressed state, serta tabel privat dan RPC aggregate terpisah agar tidak memengaruhi ranking thread.
- Mengganti Helpful/Love/Insightful pada Discussion, Review, dan reply menjadi Like/Dislike yang saling menggantikan; membersihkan reaction entry lama dan mengubah Popular menjadi Like pada thread ditambah reply visible.
- Menampilkan jumlah root pada filter All Comments, Discussions, dan Reviews serta mengubah Community Summary menjadi Total Visitors Guestbook, Today Visitors, dan Average Rating.
- Menerapkan migration reaction `202609040003` ke Supabase tertaut; history lokal/remote sinkron dan RPC reaction/statistik publik terverifikasi.
- Verifikasi akhir reaction redesign lulus pada typecheck, lint, 94 test, Prettier, production build, dan diff check.
- Mempercepat Pin/Unpin dan Hide/Unhide dengan status pending per entry, update lokal setelah server mengonfirmasi, rekonsiliasi background tanpa loading flicker, serta perlindungan dari request moderasi ganda dan respons refresh usang.
- Memperbaiki menu aksi di dekat Footer dengan menaikkan layer Guestbook dan memilih arah menu berdasarkan tinggi aktual, visual viewport, serta batas Footer agar Hide tetap dapat diklik.
- Mengganti notification inbox/polling in-app yang belum dideploy dengan Web Push opt-in per browser agar reply dapat diterima saat portfolio ditutup.
- Mengirim push untuk semua direct reply, termasuk reply ke author, Discussion, dan Review; self-reply serta aksi non-reply tidak memicu notification.
- Menambahkan service worker, web manifest, icon PWA, VAPID environment contract, subscription endpoint authenticated, reply dispatch terverifikasi, multi-device delivery, deduplikasi, dan cleanup subscription expired.
- Menambahkan test endpoint dan permission UI untuk memastikan browser permission hanya diminta setelah aksi eksplisit user.
- Menerapkan migration integritas Review dan Web Push ke Supabase project tertaut; migration history sinkron dan RPC Community Summary production merespons 200.
- Verifikasi akhir lulus pada typecheck, lint, 87 test, dan production build; aktivasi Web Push menunggu VAPID env lokal/Vercel.
- Menambahkan panel Community Summary publik berisi Total Reviews, Total Discussions, dan Average Rating dari root content visible/non-deleted.
- Memfokuskan Guestbook pada Discussion dan Portfolio Review dengan copy composer berbeda, definisi rating pengalaman portfolio, dan label Review yang tidak menyiratkan testimonial klien.
- Menambahkan migration non-destruktif untuk satu Review aktif per akun, jenis entry immutable, lookup Review milik user melalui RPC authenticated, serta tiga reaction baru yang diizinkan.
- Mengubah rating menjadi radio group bilingual, menampilkan empty rating sebagai `—`, dan menambahkan jumlah nyata pada distribusi rating.
- Membatasi sort Highest Rated pada tab Reviews dan mengembalikan sort ke Newest saat berpindah ke All atau Discussions.
- Menambahkan draft lokal composer, deteksi/edit Review aktif, status Review under moderation, replace/remove gambar saat edit, serta cleanup Storage saat soft delete.
- Memisahkan maksimal tiga pinned post ke area `Pinned by Author`, menampilkan reply count/context dan tanggal, serta memperbaiki Share menjadi deep link dengan highlight dan feedback copy.
- Menyederhanakan reaction menjadi Helpful, Love, dan Insightful; menghapus Top Contributors dan Visitor Statistics dari UI publik tanpa menghapus tracking visitor backend.
- Memisahkan kegagalan rating summary dari feed utama dan menambahkan pesan duplicate Review, session expired, serta pin limit yang dapat ditindaklanjuti.
- Menambahkan test composer, deep link, dan migration contract; verifikasi akhir lulus pada typecheck, lint, 79 test, dan production build.
- Menampilkan status `AUTHOR` pada akun owner yang telah diverifikasi melalui UUID Supabase di server.
- Melengkapi kontrol owner untuk pin/unpin root post, hide, unhide, dan soft delete pada komentar atau review.
- Menambahkan mode moderasi inline terproteksi untuk meninjau konten hidden tanpa mengeksposnya ke feed publik.
- Memperbaiki menu aksi yang overlap dengan menaikkan stacking entry aktif, memilih arah buka berdasarkan ruang viewport, serta menambahkan click-outside, Escape, pengembalian fokus, dan navigasi panah keyboard.
- Menambahkan konfirmasi Hide/Delete, focus state, dan copy moderasi bilingual tanpa string aksi hardcoded.
- Memperketat verifikasi owner agar kegagalan update profil tidak dilaporkan sebagai sukses, serta memastikan soft delete moderasi melepas status pinned.
- Menambahkan test kontrol owner dan menu; verifikasi akhir lulus pada typecheck, lint, 71 test, Prettier, dan production build.
- Menyelaraskan struktur floating preview dengan referensi: header ringkas, tab berindikator garis, identitas dan waktu entri, ringkasan rating Reviews, bintang per ulasan, dan CTA bawah terpisah.
- Menyembunyikan seluruh floating Guestbook widget pada route `/guestbook` agar kontrol tidak redundan.
- Mengganti heading menjadi `Visitor Perspectives.`/`Perspektif Pengunjung.` dengan kata terakhir beserta titik memakai aksen amber pada tema terang dan merah pada tema gelap.
- Menyesuaikan floating preview menjadi lebih ringkas dengan lebar maksimum `24rem` serta skala padding, tipografi, avatar, tab, dan CTA yang proporsional.

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

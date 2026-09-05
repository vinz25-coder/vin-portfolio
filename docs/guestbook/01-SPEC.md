# Spesifikasi Guestbook

**Status:** Baseline disetujui pada 2026-09-03; revisi 2026-09-05 disetujui eksplisit untuk implementasi, termasuk seluruh keputusan di bawah. Implementasi lokal selesai; verifikasi deployment/database dan browser manual masih diperlukan.
**Referensi visual:** Struktur thread mengikuti gambar yang diberikan; visual mengikuti design system portfolio.

## Tujuan

Menyediakan halaman komunitas `/guestbook` tempat pengunjung membaca diskusi dan ulasan, lalu berpartisipasi melalui identitas Google yang terverifikasi.

## Komposisi

- Label `GUESTBOOK`/`BUKU TAMU` mengikuti hover accent label section sebelumnya.
- Heading `Visitor Perspectives.`/`Perspektif Pengunjung.` dengan kata terakhir beserta titik memakai aksen tema, diikuti deskripsi singkat tentang kesan, masukan, dan percakapan pengunjung.
- Heading diperkecil dari `clamp(3.25rem,9vw,7.5rem)` menjadi sekitar `clamp(2.75rem,8vw,6.5rem)` tanpa mengubah General Sans, tracking, line-height, bobot, italic accent, atau struktur heading.
- Rating overview memuat average rating, total review, dan distribusi rating 1-5 beserta persentase dan jumlah; kondisi tanpa review tidak ditampilkan sebagai rating `0.0`.
- Reaction portfolio terpisah di bawah rating overview memuat 👍, ❤️, 🔥, 👏, dan 🚀 beserta jumlah masing-masing dalam satu bar horizontal.
- Composer memuat pilihan Discussion/Review, rating dan kategori wajib untuk Review, teks maksimal 1.000 karakter, full emoji picker, satu gambar, dan tombol post; tidak ada mention UI.
- Header composer menggabungkan konteks akun `Posting as`, status Author, Sign out kecil, kontrol notifikasi, serta pilihan Discussion/Review agar identitas tidak menjadi bar terpisah.
- Distribusi rating memakai track yang cukup tebal dan kontras untuk dipindai cepat pada kedua tema.
- Filter memuat All Comments, Discussions, Reviews beserta jumlah root thread masing-masing, serta sort Newest, Popular, dan Highest Rated.
- Feed memakai root post, reply, dan satu nested reply seperti referensi.
- Sidebar menampilkan Community Summary berisi Total Visitors Guestbook, Today Visitors, dan Average Rating, lalu Community Guidelines; contributor ranking tidak ditampilkan sebagai gamification publik.
- Empty state memakai data nol yang nyata tanpa seed, komentar, contributor, atau statistik palsu.
- Scanner, viewport blur, header, social rail, dan Footer global tetap digunakan.
- Floating widget desktop/tablet pada route selain `/guestbook` membuka preview Discussions/Reviews dengan maksimal tiga thread terbaru dan CTA menuju halaman penuh; trigger tidak langsung berpindah route.
- Preview mengikuti struktur editorial referensi: header ringkas, tab berindikator garis, identitas dan waktu entri, ringkasan rating pada Reviews, serta CTA bawah yang terpisah.
- Hamburger menu hanya memuat navigasi tanpa preview atau social links. Guestbook menjadi link langsung dan memakai penanda aktif saat route `/guestbook` dibuka.
- Pada route selain Home, logo kembali ke `/#home` dan link About, Skills, serta Experience kembali ke anchor terkait di Home.

## Copy Utama

| Elemen       | English                                                                       | Indonesia                                                                      |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Label        | `GUESTBOOK`                                                                   | `BUKU TAMU`                                                                    |
| Heading      | `Visitor Perspectives.`                                                       | `Perspektif Pengunjung.`                                                       |
| Deskripsi    | `Thoughts, feedback, and conversations shared by visitors to this portfolio.` | `Kesan, masukan, dan percakapan yang dibagikan oleh pengunjung portfolio ini.` |
| Empty state  | `No conversations yet. Be the first to share your thoughts.`                  | `Belum ada percakapan. Jadilah yang pertama membagikan pendapat.`              |
| Login prompt | `Sign in with Google to join the conversation.`                               | `Masuk dengan Google untuk bergabung dalam percakapan.`                        |
| Composer     | `Write a comment`                                                             | `Tulis komentar`                                                               |
| Placeholder  | `Share your thoughts...`                                                      | `Bagikan pendapat Anda...`                                                     |
| Submit       | `Post comment`                                                                | `Kirim komentar`                                                               |

## Identitas dan Akses

- Seluruh pengunjung dapat membaca konten visible tanpa login.
- Google login wajib untuk post, reply, reaction, report, edit, dan delete.
- Tidak ada anonymous posting.
- Nama dan avatar selalu berasal dari metadata Google serta tidak dapat diedit di Guestbook.
- Profile Guestbook yang hilang dipulihkan dari metadata Google terverifikasi sebelum mutation agar akun Auth tidak terblokir oleh sinkronisasi lama.
- Akun owner dikenali menggunakan UUID Supabase pada environment server dan mendapat badge `AUTHOR`.

## Post, Rating, dan Thread

- Root post dipilih eksplisit sebagai Discussion atau Review.
- Review wajib memiliki rating integer 1-5; Discussion dan reply tidak memiliki rating.
- Review wajib memiliki minimal satu kategori unik dari `portfolio`, `ui_ux_design`, `code_quality`, `communication`, `collaboration`, dan `overall_experience`; seluruh kategori dapat dipilih bersamaan. Default dan backfill Review lama adalah `portfolio`. Discussion dan reply tidak memiliki kategori.
- Kategori dapat dipilih melalui multi-select saat membuat dan mengedit Review; seluruh label terpilih tampil pada entry dan floating preview. Kategori bukan jenis entry baru dan tidak menambah filter atau slot Review per akun.
- Review merupakan penilaian pengunjung sesuai kategori, bukan klaim pengalaman kerja atau testimonial klien yang diverifikasi.
- Satu akun hanya memiliki satu Review aktif; Review berikutnya mengedit Review yang sudah ada.
- Lookup Review tanpa hasil harus menghasilkan `null`, bukan record all-null; shortcut edit memvalidasi ulang Review sebelum membuka editor dan error edit tampil di dalam dialog.
- Jenis root post tidak dapat diubah setelah dipublikasikan.
- Average, distribusi rating, dan Highest Rated tetap menggabungkan semua kategori Review visible yang tidak dihapus.
- Thread dibatasi pada root post, reply, dan satu nested reply. Balasan setelah batas tetap berada pada level terakhir; konteks target direct reply tetap dipertahankan tanpa mention UI.
- User dapat mengedit dan menghapus konten sendiri. Delete pengunjung tetap menghasilkan tombstone agar thread utuh; permanent delete hanya tersedia untuk Author terverifikasi server.
- Root post owner dapat di-pin. Pinned post selalu berada di atas hasil sort.
- Pinned content ditampilkan pada area `Pinned by Author` terpisah dan dibatasi maksimal tiga root post.

## Composer dan Media

- Body wajib, maksimal 1.000 karakter, dan mendukung emoji Unicode.
- Satu gambar JPEG, PNG, atau WebP maksimal 5 MB dapat dilampirkan pada post atau reply.
- Tombol `@`, popup participant, state mention, dan guideline mention dihapus. `@nama` yang diketik manual tetap teks biasa dan tidak memicu notification.
- Trigger kecil Add emoji membuka full emoji picker dengan search dan seluruh katalog emoji. Pilihan disisipkan pada caret/selection textarea, bukan selalu di akhir, dengan tetap mematuhi batas 1.000 karakter.
- Picker dimuat secara dinamis, mengikuti tema aktif, tidak overflow pada mobile, serta ditutup setelah pemilihan, Escape, atau klik di luar dengan fokus kembali ke textarea.
- Gambar disimpan di Supabase Storage dan hanya path-nya disimpan pada entry.

### Label Kategori

Copy bilingual berikut disetujui bersama revisi:

| Nilai                | English            | Indonesia              |
| -------------------- | ------------------ | ---------------------- |
| `portfolio`          | Portfolio          | Portfolio              |
| `ui_ux_design`       | UI/UX Design       | Desain UI/UX           |
| `code_quality`       | Code Quality       | Kualitas Kode          |
| `communication`      | Communication      | Komunikasi             |
| `collaboration`      | Collaboration      | Kolaborasi             |
| `overall_experience` | Overall Experience | Pengalaman Keseluruhan |

## Reaction, Filter, dan Ranking

- Reaction portfolio wajib login, dapat di-toggle, dan dibatasi satu reaction aktif per jenis emoji per akun; reaction ini tidak memengaruhi ranking thread.
- Discussion, Review, dan reply hanya memiliki Like dan Dislike yang saling menggantikan; menekan vote aktif membatalkannya.
- Semua Like/Dislike memakai state aktif compact dengan background tipis berbasis `color-mix()` dari `--color-accent-500`, tanpa active border, ring, glow, scale, atau lift. Ikon dan count horizontal dengan gap kecil; ukuran default/aktif sama. Focus outline keyboard dan pressed state tetap tersedia. Style reaction portfolio tidak berubah.
- Reaction entry lama dihapus saat migrasi agar Helpful/Love/Insightful tidak diartikan ulang sebagai vote baru.
- Newest mengurutkan waktu publikasi terbaru.
- Popular mengurutkan jumlah Like pada thread ditambah jumlah reply visible/non-deleted, lalu waktu terbaru; Dislike tidak meningkatkan Popular.
- Highest Rated otomatis menampilkan Review dan mengurutkan rating, popular score, lalu waktu terbaru.
- Highest Rated hanya tersedia pada filter Reviews; berpindah ke All atau Discussions mengembalikan sort ke Newest.
- All Comments menghitung total root Discussion dan Review; reply tidak masuk count filter dan tetap ditampilkan per thread jika jumlahnya lebih dari nol.
- Feed memuat sepuluh root thread awal; root ke-11 memunculkan Load More Comments dan setiap aksi menambahkan maksimal sepuluh root berikutnya tanpa batas total 50.
- Setiap thread menampilkan tiga reply awal; reply ke-4 memunculkan View More Replies dan setiap aksi membuka tiga reply berikutnya. Deep link otomatis membuka reply target yang masih terlipat.

## Visitor Statistics

- Community Summary menampilkan Total Visitors dan Today Visitors untuk route `/guestbook`.
- Visitor berarti browser unik, bukan manusia unik.
- Browser membuat random ID lokal; server menyimpan HMAC ID tersebut tanpa IP, fingerprint, atau ID mentah.
- Satu browser dihitung sekali per hari. Today dan rolling tujuh hari memakai zona `Asia/Jakarta`.
- Total Comments menghitung post dan reply visible yang tidak dihapus.
- Statistik kunjungan ditampilkan sebagai aggregate tanpa mengekspos identifier browser.

## Moderasi dan Report

- Konten normal langsung visible; pola deterministik yang mencurigakan masuk Pending atau Quarantined dan tidak muncul pada feed sebelum disetujui owner.
- Server membatasi per akun: tiga root per 10 menit, sepuluh reply per 10 menit, lima report per 30 menit, dan tiga puluh reaction per menit.
- Body identik dari akun yang sama dalam 24 jam ditolak. Link-only, empat URL atau lebih, dan pengulangan ekstrem dikarantina; dua-tiga URL atau pengulangan menengah masuk Pending.
- User login dapat report satu kali per entry dengan alasan spam, harassment, hate, threat, illegal activity, phishing, personal data, irrelevant, inappropriate, atau other serta catatan opsional; user tidak dapat report konten sendiri.
- Tiga report unik otomatis mengarantina entry untuk review owner. Report tidak menghapus konten permanen.
- Owner dapat pin/unpin root post, approve, hide, unhide, soft delete, dan block user melalui kontrol inline.
- Soft-delete pemilik entry mencatat deletion source `commenter`; soft-delete melalui moderasi owner mencatat `site_author`. Existing tombstone dibackfill `commenter`, berdasarkan informasi sesi sebelumnya bahwa database Guestbook kosong; ini bukan hasil pemeriksaan database baru pada revisi dokumen ini.
- Main feed dan floating preview menampilkan `Deleted by commenter` / `Dihapus oleh pengirim` atau `Removed by Author` / `Dihapus oleh Author`. UUID pelaku tidak diekspos. Body, rating, image, reaction, dan kontrol interaksi tetap disembunyikan pada tombstone.
- Author terverifikasi server mendapat action terpisah `permanent_delete`, termasuk pada entry miliknya sendiri dan existing tombstone. Tombstone memiliki pengecualian menu owner-only yang hanya memuat permanent delete; seluruh kontrol publik tetap tersembunyi. Soft-delete tetap dipertahankan; pengunjung tidak mendapat akses permanent delete.
- Konfirmasi permanent delete wajib menjelaskan bahwa tindakan tidak dapat dibatalkan, menghapus entry secara fisik, dan menghapus seluruh subtree reply di bawahnya. Copy disetujui: `Permanently delete this entry and all replies beneath it? This physically removes them and cannot be undone.` / `Hapus permanen entri ini dan seluruh balasan di bawahnya? Tindakan ini menghapusnya secara fisik dan tidak dapat dibatalkan.`
- Permanent delete menghapus subtree secara transaksional beserta reactions, mentions, reports, dan push delivery terkait; seluruh gambar subtree dibersihkan dari Storage melalui moderation API. Feed, moderation queue, rating summary, filter count, dan active Review state disinkronkan setelah berhasil.
- Block berlaku khusus mutation Guestbook, tidak menghapus akun Google, tidak dapat diterapkan kepada owner, dan menyembunyikan seluruh konten aktif target.
- Owner memiliki mode moderasi inline untuk melihat konten pending/quarantined, menyetujuinya, menyembunyikan, menghapus, atau memblokir author tanpa mengekspos konten tersebut ke feed publik.
- Antrean report ditinjau melalui Supabase Dashboard; dashboard moderasi khusus tidak termasuk baseline.
- Konten hidden tidak masuk feed publik, rating, statistik komentar, atau contributor ranking.

## Notifikasi

- Semua user login, termasuk author, dapat memilih mengaktifkan Web Push pada browser/perangkatnya.
- Pemilik post atau komentar menerima push ketika user lain membalasnya langsung; self-reply, reaction, edit, mention tanpa reply, pin, hide, dan delete tidak memicu push.
- Reply pada Discussion dan Review sama-sama dapat memicu push. Klik push membuka deep link ke reply terkait meskipun portfolio sebelumnya ditutup.
- Permission hanya diminta setelah aksi eksplisit user dan dapat dinonaktifkan kembali per browser; subscription tidak dapat dibaca atau ditulis langsung melalui client Supabase.
- Delivery dideduplikasi per reply dan subscription; subscription invalid/expired dinonaktifkan dengan menghapusnya.

## Community Guidelines

- Be respectful and kind to others. / Bersikaplah sopan dan baik kepada orang lain.
- No spam or self-promotion. / Dilarang melakukan spam atau promosi diri.
- Keep discussions relevant to the portfolio. / Pastikan diskusi tetap relevan dengan portfolio.
- Report any inappropriate content. / Laporkan konten yang tidak pantas.
- Penutup: `Thank you for keeping this community positive.` / `Terima kasih telah menjaga komunitas ini tetap positif.`

## Responsif dan Aksesibilitas

- Pada lebar <1280px, satu alur dokumen tanpa internal page scroll mengikuti urutan Rating, Reaction, Community Summary, Community Guidelines, composer/sign-in, lalu filters/feed.
- Pada lebar >=1280px, main feed dan sidebar asimetris tetap dipertahankan dengan sidebar sticky di kanan.
- Filter dapat di-scroll horizontal tanpa page overflow dan dapat digunakan dengan keyboard.
- Dialog, form, rating, kategori, reaction, menu, upload, emoji picker, dan feedback memiliki label, focus state, serta live region yang sesuai.
- Composer menyimpan draft Discussion/Review lokal termasuk kategori, membedakan instruksi kedua jenis konten, memakai radio group untuk rating, dan checkbox-chip multi-select untuk kategori Review dengan default Portfolio.
- Share menghasilkan deep link yang dapat memfokuskan dan menyorot entry tujuan serta memberi feedback setelah link disalin.
- Informasi rating/reaction tidak disampaikan melalui warna saja.
- Reduced motion menghapus translate dan stagger dekoratif tanpa mengurangi fungsi.

## Kriteria Selesai

- Direct URL `/guestbook`, navigation widget, browser back/forward, dan OAuth return bekerja.
- Empty, loading, success, error, signed-out, signed-in, dan owner state eksplisit.
- Supabase schema, Storage policy, RLS, aggregation, visitor endpoint, dan owner moderation tersedia.
- Light/dark, ID/EN, keyboard, reduced motion, mobile landscape, tablet, dan desktop bekerja.
- Typecheck, lint, test, audit aksesibilitas, dan production build lulus.

## Batas Scope

Notifikasi email, notification inbox, notification reaction/mention, emoji reaction bebas khusus reply, edit profil, anonymous posting, hashtag, galeri multi-image, infinite scroll, dan dashboard moderasi terpisah tidak termasuk baseline.

## Keputusan Revisi Disetujui

- Author dapat permanent delete existing tombstone melalui menu khusus owner-only, termasuk entry miliknya sendiri.
- Subtree hanya mengikuti relasi `parent_id` tersimpan. Normalisasi depth dapat membuat direct reply menjadi sibling; sibling tersebut tidak dihapus. Penerima Web Push bukan relasi subtree.
- Copy bilingual kategori dan konfirmasi, serta dependency `emoji-picker-react`, disetujui. Tidak ada open item desain yang memblokir implementasi.
- Migration dibuat lokal saja. Penerapan ke database live tetap membutuhkan izin terpisah; pemeriksaan browser/database yang belum dijalankan dicatat pada changelog.

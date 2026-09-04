# Spesifikasi Guestbook

**Status:** Disetujui untuk implementasi pada 2026-09-03
**Referensi visual:** Struktur thread mengikuti gambar yang diberikan; visual mengikuti design system portfolio.

## Tujuan

Menyediakan halaman komunitas `/guestbook` tempat pengunjung membaca diskusi dan ulasan, lalu berpartisipasi melalui identitas Google yang terverifikasi.

## Komposisi

- Label `GUESTBOOK`/`BUKU TAMU` mengikuti hover accent label section sebelumnya.
- Heading `Visitor Perspectives.`/`Perspektif Pengunjung.` dengan kata terakhir beserta titik memakai aksen tema, diikuti deskripsi singkat tentang kesan, masukan, dan percakapan pengunjung.
- Rating overview memuat average rating, total review, dan distribusi rating 1-5 beserta persentase.
- Composer memuat pilihan Discussion/Review, rating wajib untuk Review, teks maksimal 1.000 karakter, emoji, satu gambar, mention, dan tombol post.
- Filter memuat All Comments, Discussions, Reviews serta sort Newest, Popular, dan Highest Rated.
- Feed memakai root post, reply, dan satu nested reply seperti referensi.
- Sidebar memuat Top Contributors maksimal lima orang, Visitor Statistics, dan Community Guidelines.
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
- Akun owner dikenali menggunakan UUID Supabase pada environment server dan mendapat badge `AUTHOR`.

## Post, Rating, dan Thread

- Root post dipilih eksplisit sebagai Discussion atau Review.
- Review wajib memiliki rating integer 1-5; Discussion dan reply tidak memiliki rating.
- Average dan distribusi hanya menghitung Review visible yang tidak dihapus.
- Thread dibatasi pada root post, reply, dan satu nested reply. Balasan setelah batas tetap berada pada level terakhir dengan mention target.
- User dapat mengedit dan menghapus konten sendiri. Konten terhapus menjadi tombstone agar thread tetap utuh.
- Root post owner dapat di-pin. Pinned post selalu berada di atas hasil sort.

## Composer dan Media

- Body wajib, maksimal 1.000 karakter, dan mendukung emoji Unicode.
- Satu gambar JPEG, PNG, atau WebP maksimal 5 MB dapat dilampirkan pada post atau reply.
- Mention menggunakan autocomplete participant yang pernah berkontribusi dan tidak mengirim notifikasi pada baseline.
- Gambar disimpan di Supabase Storage dan hanya path-nya disimpan pada entry.

## Reaction, Filter, dan Ranking

- Reaction: thumb, heart, fire, clap, dan rocket.
- Multi-react diperbolehkan; satu user hanya dapat memilih satu kali per jenis reaction pada entry yang sama.
- Newest mengurutkan waktu publikasi terbaru.
- Popular mengurutkan jumlah reaction pada thread ditambah jumlah reply, lalu waktu terbaru.
- Highest Rated otomatis menampilkan Review dan mengurutkan rating, popular score, lalu waktu terbaru.
- Feed memuat sepuluh root thread awal dengan tombol Load More.
- Top Contributors dihitung dari post aktif, reply aktif, dan reaction yang diterima; maksimal lima profil dengan skor nyata.

## Visitor Statistics

- Menampilkan Total Visitors, Total Comments, Today Visitors, dan This Week.
- Visitor berarti browser unik, bukan manusia unik.
- Browser membuat random ID lokal; server menyimpan HMAC ID tersebut tanpa IP, fingerprint, atau ID mentah.
- Satu browser dihitung sekali per hari. Today dan rolling tujuh hari memakai zona `Asia/Jakarta`.
- Total Comments menghitung post dan reply visible yang tidak dihapus.

## Moderasi dan Report

- Konten langsung visible setelah dibuat.
- User login dapat report satu kali per entry dengan alasan spam, harassment, irrelevant, inappropriate, atau other serta catatan opsional.
- Owner dapat pin/unpin root post, hide/unhide, dan delete melalui kontrol inline.
- Antrean report ditinjau melalui Supabase Dashboard; dashboard moderasi khusus tidak termasuk baseline.
- Konten hidden tidak masuk feed publik, rating, statistik komentar, atau contributor ranking.

## Community Guidelines

- Be respectful and kind to others. / Bersikaplah sopan dan baik kepada orang lain.
- No spam or self-promotion. / Dilarang melakukan spam atau promosi diri.
- Keep discussions relevant to the portfolio. / Pastikan diskusi tetap relevan dengan portfolio.
- Use `@mention` to reply to someone. / Gunakan `@mention` untuk menanggapi seseorang.
- Report any inappropriate content. / Laporkan konten yang tidak pantas.
- Penutup: `Thank you for keeping this community positive.` / `Terima kasih telah menjaga komunitas ini tetap positif.`

## Responsif dan Aksesibilitas

- Mobile memakai satu alur dokumen tanpa internal page scroll; sidebar berpindah setelah feed.
- Tablet mempertahankan hierarki satu kolom lebar; desktop memakai main feed dan sidebar asimetris.
- Filter dapat di-scroll horizontal tanpa page overflow dan dapat digunakan dengan keyboard.
- Dialog, form, rating, reaction, menu, upload, mention, dan feedback memiliki label, focus state, serta live region yang sesuai.
- Informasi rating/reaction tidak disampaikan melalui warna saja.
- Reduced motion menghapus translate dan stagger dekoratif tanpa mengurangi fungsi.

## Kriteria Selesai

- Direct URL `/guestbook`, navigation widget, browser back/forward, dan OAuth return bekerja.
- Empty, loading, success, error, signed-out, signed-in, dan owner state eksplisit.
- Supabase schema, Storage policy, RLS, aggregation, visitor endpoint, dan owner moderation tersedia.
- Light/dark, ID/EN, keyboard, reduced motion, mobile landscape, tablet, dan desktop bekerja.
- Typecheck, lint, test, audit aksesibilitas, dan production build lulus.

## Batas Scope

Notifikasi mention/reply, edit profil, anonymous posting, hashtag, galeri multi-image, infinite scroll, dan dashboard moderasi khusus tidak termasuk baseline.

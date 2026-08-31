# Quality Guardrails Global

Aturan ini berlaku untuk seluruh section.

## Scope dan Konten

- Implementasikan hanya scope yang sudah disetujui pada `01-SPEC.md`.
- Jangan membuat copy personal, statistik, URL, pengalaman, atau data yang belum diberikan.
- Jangan memperluas pekerjaan ke section lain tanpa instruksi.
- Jika keputusan penting belum tersedia, tandai sebagai open item dan berhenti sebelum bagian tersebut dibutuhkan.

## Desain

- Semua warna harus berasal dari `DESIGN-SYSTEM.md` atau token yang telah disetujui.
- Hindari pola portfolio generik: card berulang, gradient blob, badge acak, skill percentage palsu, dan dekorasi tanpa fungsi.
- Jangan mengulang elemen dominan dari section sebelumnya tanpa alasan, misalnya portrait yang sama pada About.
- Pertahankan konsistensi kedua tema dan jangan menambahkan polish di luar permintaan.

## Kode

- TypeScript strict: tanpa `any` atau suppress error tanpa alasan terdokumentasi.
- Pilih perubahan terkecil yang benar; hindari abstraksi satu kali dan refactor di luar scope.
- Gunakan komponen, token, hook, dan dependency yang sudah ada terlebih dahulu.
- Jangan meninggalkan dead code, log debug, blok komentar, atau placeholder yang tampak final.
- Jangan mengubah atau menghapus pekerjaan lain yang tidak terkait.

## Aksesibilitas dan Responsif

- Gunakan semantic HTML, label bermakna, urutan heading benar, dan focus state terlihat.
- Elemen nonaktif harus eksplisit dan tidak berpura-pura berfungsi.
- Semua interaksi harus dapat digunakan dengan keyboard dan tidak bergantung pada hover.
- Hormati reduced motion serta uji mobile portrait, landscape pendek, tablet, dan desktop.
- Cegah layout shift, overflow viewport, dan gambar stretch.

## Gate Review

- Spec section sudah disetujui sebelum kode section ditulis.
- Typecheck, lint, test, dan build lulus.
- Light/dark, ID/EN, keyboard, reduced motion, dan breakpoint utama diperiksa.
- Changelog diperbarui saat baseline final atau revisi yang disetujui selesai.

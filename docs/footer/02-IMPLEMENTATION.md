# Rencana Implementasi Footer

**Status:** Diimplementasikan pada 2026-09-02

## Struktur

| Bagian                                       | Tanggung jawab                                          |
| -------------------------------------------- | ------------------------------------------------------- |
| `src/components/footer/Footer.tsx`           | Theme, copyright, konfigurasi particle, dan waktu.      |
| `src/components/footer/ParticleText.tsx`     | Sampling glyph, particles, motion, pointer, dan resize. |
| `src/components/footer/ParticleText.css`     | Layout canvas dan accessible hidden text.               |
| `src/components/global/ViewportEdgeBlur.tsx` | Memudarkan bottom blur pada akhir halaman.              |
| `src/App.tsx`                                | Menempatkan Footer setelah `WorkWithMe`.                |
| `src/App.test.tsx`                           | Struktur, urutan, metadata, canvas, dan accessibility.  |

## ParticleText

- Adaptasi perilaku registry `ParticleText-JS-CSS` ke TypeScript strict.
- Sampling memakai canvas offscreen dan `measureText` untuk mengecilkan font ke lebar aman.
- Partikel mencampur base dan highlight berdasarkan posisi horizontal dengan variasi seed.
- Gathering, idle drift, glow, dan pointer repel menggunakan Canvas API tanpa dependency tambahan.
- Mobile di bawah 640px memakai glyph weight, ukuran partikel, glow, dan idle drift yang lebih ringan agar ruang negatif serta batas huruf tetap terbaca pada canvas sempit.
- `ResizeObserver` membangun ulang target saat ukuran berubah.
- `IntersectionObserver` menghentikan RAF ketika footer tidak terlihat.
- Pointer memakai koordinat lokal event tanpa layout read per gerakan; kalkulasi release dan respons frame-rate-independent dilakukan sekali per frame.
- Batas partikel desktop/fine pointer adalah 1.400 dan perangkat lain 900 agar interaksi tetap responsif tanpa mengubah bentuk wordmark.

## Layout

- Copyright dipusatkan sebelum canvas.
- Canvas hampir memenuhi viewport tetapi mempertahankan inset aman.
- Waktu ditempatkan setelah canvas di kiri bawah dengan ikon `Clock3`.
- Lokasi waktu dibaca dari dictionary `copy.footer.location` untuk pasangan English/Indonesia.
- Nama `Evindo A.` pada copyright memakai class accent glow khusus.
- Tinggi canvas memakai `clamp(4.5rem, 13vw, 12rem)` dan sampling memakai bounding box glyph aktual untuk menghilangkan ruang vertikal berlebih.
- Footer memakai safe-area padding bawah minimal agar metadata dekat dengan batas bawah viewport.
- Tidak ada wrapper visual, panel, border, atau divider.

## Waktu Lokal

- `Intl.DateTimeFormat` memakai zona `Asia/Jakarta` dan format `HH:mm`.
- Pembaruan pertama disinkronkan dengan batas menit, lalu setiap 60 detik.
- Timeout dan interval dibersihkan saat unmount.

## Verifikasi

- Canvas `aria-hidden` dan nama tersedia sebagai hidden text.
- Wordmark, copyright, dan waktu mengikuti urutan yang disetujui.
- Theme mengubah pasangan warna particle.
- Jalankan `npm run typecheck`, `npm run lint`, test, dan `npm run build`.

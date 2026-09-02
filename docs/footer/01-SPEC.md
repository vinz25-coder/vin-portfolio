# Spesifikasi Footer

**Status:** Disetujui untuk implementasi pada 2026-09-02

## Tujuan

Menutup halaman setelah Contact/`WorkWithMe` dengan particle wordmark `EVINDO AMANDA.` yang hidup, interaktif, mencolok, dan tetap profesional, dilengkapi copyright serta waktu Indonesia.

## Konsep Disetujui

- Wordmark memakai ParticleText canvas dari registry React Bits yang diadaptasi ke TypeScript strict.
- Nama selalu satu baris dan menyesuaikan ukuran berdasarkan lebar canvas agar tidak terpotong.
- Partikel berkumpul saat mount, bergerak ringan saat idle, dan menjauh dari pointer.
- Campuran warna teks utama dan accent theme dibuat jelas dengan glow terkontrol.
- Footer transparan tanpa panel, kotak, bar, border, divider, atau stroke.

## Theme

- Light particle base: `#43403e`; highlight/glow amber `#e0a553`.
- Dark particle base: `#f5f5f4`; highlight/glow merah `#e9333d`.
- Metadata memakai token teks sekunder dan ikon memakai accent theme.

## Metadata

- Copyright: `© 2026 Evindo A. All rights reserved.`.
- Copyright dipusatkan tepat di atas particle wordmark.
- Copyright memakai ukuran lebih besar dan weight bold; `Evindo A.` memakai weight extra-bold serta kontras lebih tinggi tanpa glow.
- Copyright memakai jarak rapat ke area glyph, bukan ke ruang kosong canvas.
- Waktu memakai zona `Asia/Jakarta` dan format `HH:mm (GMT+7)`.
- Waktu berada di kiri paling bawah dengan format ikon jam, lokasi terjemahan, separator `·`, lalu waktu.
- English memakai `NORTH SUMATRA, INDONESIA`; Indonesia memakai `SUMATERA UTARA, INDONESIA`.
- Waktu berjarak rapat dari wordmark dan footer memakai inset bawah minimal dekat batas viewport.
- Angka waktu memakai tabular numerals dan diperbarui tepat saat menit berganti.

## Motion dan Aksesibilitas

- Gathering berjalan sekali ketika komponen dibentuk.
- Pointer repel hanya aktif pada fine pointer.
- Idle drift tetap lembut agar nama terbaca.
- `prefers-reduced-motion` langsung menampilkan nama tanpa scatter, drift, repel, atau glow.
- Canvas bersifat dekoratif dan disembunyikan dari accessibility tree.
- Nama lengkap tersedia sebagai visually hidden text.

## Responsif dan Performa

- Wordmark tetap satu baris pada seluruh breakpoint.
- Font otomatis diperkecil agar seluruh glyph dan titik memiliki inset aman.
- Canvas memakai tinggi fluid dan mencegah horizontal overflow.
- Device pixel ratio dibatasi ke `2`.
- Jumlah partikel dibatasi dan render berhenti ketika footer di luar viewport.
- Blur bawah viewport memudar saat halaman mencapai akhir.

## Kriteria Selesai

- Footer hadir tepat setelah `WorkWithMe`.
- Copyright berada di tengah di atas nama.
- `EVINDO AMANDA.` terbaca utuh dan tidak terpotong.
- Waktu kiri bawah menampilkan ikon, lokasi terjemahan, `·`, dan `HH:mm (GMT+7)`.
- Light/dark, pointer interaction, reduced motion, dan accessibility bekerja.
- Typecheck, lint, test, audit aksesibilitas, dan production build lulus.

## Batas Scope

Footer tidak menambahkan social links, navigasi, CTA, statistik, background solid, atau dependency baru.

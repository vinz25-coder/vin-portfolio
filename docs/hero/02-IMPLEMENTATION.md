# Implementasi Hero

**Status:** Final dan menjadi baseline pemeliharaan.

## Struktur

| Bagian             | Tanggung jawab                                        |
| ------------------ | ----------------------------------------------------- |
| `Hero.tsx`         | Komposisi dan navbar state tanpa overlay batas.       |
| `HeroHeader.tsx`   | Logo, nav, bahasa, tema, menu responsif, dan scroll.  |
| `HeroContent.tsx`  | Eyebrow, heading, deskripsi, dan CTA.                 |
| `HeroPortrait.tsx` | Responsive image, crossfade, mask, dan parallax.      |
| `HeroSidebar.tsx`  | Link sosial fixed, tooltip, dan focus lintas section. |
| Root `App`         | Scanner, blur tepi, social rail, chat, dan cursor.    |

## Data dan State

- Tema: `ThemeContext`, key `portfolio-theme`.
- Bahasa: `LanguageContext`, key `portfolio-language`.
- Copy: `src/locales/en.ts` dan `src/locales/id.ts`.
- Sosial: GitHub, X, Instagram, dan email aktif.
- CTA dan navigasi ke section berikutnya masih nonaktif secara eksplisit.

## Navbar Global

- Header hanya mengatur posisi; tidak memiliki background full-width.
- Shell header fixed memakai `pointer-events: none`; pointer diaktifkan kembali hanya pada logo, menu/nav, dan kelompok kontrol kanan agar area transparan tidak memblokir CTA atau konten di belakangnya.
- Logo selalu tampil polos tanpa treatment scroll dan memakai anchor `#home` menuju root Hero; accessible name mengikuti locale ID/EN.
- Pil navigasi, bahasa, tema, dan menu mobile menerima `data-scrolled` secara independen.
- Surface kontrol tetap transparan dengan backdrop blur, border rendah kontras, dan neutral depth shadow tanpa glow putih.
- Nav aktif memakai teks aksen, wash tipis, dan garis pendek; hover menampilkan garis parsial, sedangkan item nonaktif tidak menerima feedback interaktif.
- Strip fixed memakai `useScroll()` dan `useTransform()` untuk memetakan scroll 0-96px ke opacity 0-1 dan blur 0-7,28px.
- Strip memakai `mask-image` dan `-webkit-mask-image`: solid sampai 60%, lalu memudar ke transparan pada 100%.
- Backdrop filter berada pada child yang dibatasi `contain: paint` dan `overflow: hidden` agar blur tidak meluas ke konten section.
- Strip tidak memiliki background, border, atau shadow.
- Blur bawah selalu fixed tanpa listener scroll atau motion value. Tiga child transparan memakai backdrop blur 2px, 6px, dan 12px dengan mask start berbeda untuk menghasilkan progressive blur tanpa bar solid.
- Blur bawah melepaskan `contain: paint` dan `isolation: isolate` agar child backdrop filter dapat membaca page content di belakangnya; navbar tetap tajam pada z-index yang lebih tinggi.
- `ViewportEdgeBlur` berada di root agar aturan ini otomatis berlaku untuk semua section.
- Posisi awal dan gap transparan antarkelompok tidak berubah pada semua breakpoint.

## Transisi Section

- Hero dan section berikutnya memakai background transparan di atas scanner global.
- Tidak ada `hero-bottom-fade`, gradient warna solid, border, atau divider pada batas section.
- Spacing section dan blur tepi viewport menjaga perpindahan tetap lembut tanpa memotong animasi background.

## Portrait

| Tema   | Source          | Varian AVIF/WebP     |
| ------ | --------------- | -------------------- |
| Terang | PNG `1024x1024` | `640`, `960`, `1024` |
| Gelap  | PNG `1254x1254` | `640`, `960`, `1254` |

Keduanya memakai rasio `1:1`; generator menolak upscale. Jalankan `npm run images:portrait` jika source berubah.

Wrapper `hero-portrait-mask` memakai `mask-image` vertikal yang mulai melembut pada 48% dan turun melalui beberapa stop opacity hingga transparan pada 100%. Kurva panjang ini menghilangkan cutoff jas tanpa blur langsung pada wajah atau gambar.
`Hero` menyediakan ref section sebagai target `usePointerParallax`; motion values x/y diterapkan pada wrapper `portrait-parallax`. Listener hanya aktif pada fine pointer di luar viewport mobile dan dibersihkan saat kondisi media berubah.
Portrait tidak memakai scale overscan agar tepi gambar tidak terpotong oleh border-box mask.
Pada viewport `>=640px`, `hero-layout` tidak menjadi containing block. Portrait absolut selalu mengacu langsung ke section Hero, tetap berjangkar di bawah, dan ukurannya dibatasi oleh ruang vertikal setelah header.
Penempatan portrait desktop/laptop memiliki toleransi mulai `960px` pada viewport dengan tinggi lebih dari `500px`, tanpa mengubah mobile landscape pendek. Landscape mulai `1024px` memakai lebar responsif hingga `54vw` dengan batas `58rem`. Pada orientasi portrait hingga `1199.98px`, termasuk iPad Pro `1024x1366`, portrait memakai formula iPad Mini/Air yang sama: `110vw`, batas `64rem`, dan offset kanan responsif negatif. Mulai `1200px`, portrait kembali mengikuti komposisi desktop. Batas tinggi viewport tetap menjadi pengaman.

## Scanner Interaktif

- `ScannerBackground` tetap `pointer-events: none` dan fixed di belakang page content.
- Canvas Scanner mendengar `pointermove` pasif pada `window`, bukan event langsung pada canvas, sehingga uniform mouse tetap hidup tanpa menghalangi link, CTA, atau kontrol lain.
- `pointerleave` pada document root menurunkan mouse-active secara gradual; listener dilepas saat cleanup.
- Scanner tidak dirender saat reduced motion dan tetap menggunakan satu instance global untuk seluruh section.

## Chat Global

- Trigger mengambang berada di pojok kanan bawah pada tablet dan desktop; tablet memakai target 64px, desktop 56px.
- Mobile ringkas membuka chat melalui Guestbook pada menu navigasi.

## Pemeliharaan

- Pertahankan Hero sebagai baseline final.
- Perubahan harus mengikuti dokumen global dan scope yang disetujui.
- Catat revisi final di `CHANGELOG.md` dan jalankan verifikasi standar.
- Custom cursor memakai trailing eksponensial berbasis waktu yang cepat dan berhenti menjadwalkan RAF setelah posisi stabil. Glass dipertahankan tanpa backdrop filter pada layer bergerak; scanner fullscreen dibatasi ke DPR 1,25 untuk menyeimbangkan ketajaman dan headroom frame pada layar HiDPI/high-refresh.

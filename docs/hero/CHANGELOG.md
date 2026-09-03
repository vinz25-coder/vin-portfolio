# Changelog Hero

## 2026-09-03 - Optimasi Respons Pointer

- Menghapus trailing lerp dan backdrop filter dari custom cursor agar posisi mengikuti frame pointer terbaru tanpa repaint blur pada layer bergerak.
- Membatasi render internal scanner ke resolusi CSS pixel dan menonaktifkan grain shader untuk mengurangi beban GPU tanpa mengubah komposisi background.

## 2026-09-01 - Pembesaran Portrait Desktop

- Memperbesar portrait Hero mulai breakpoint 1024px menjadi hingga 54vw dengan batas 58rem.
- Menyesuaikan posisi kanan dan responsive image sizes agar komposisi tetap seimbang dan aset yang dipilih sesuai ukuran render.
- Menambahkan toleransi penempatan desktop/laptop mulai 960px pada viewport tinggi agar boundary seperti 1023x1366 tidak memakai offset tablet portrait tanpa mengubah mobile landscape pendek.
- Menyamakan ukuran dan offset portrait iPad Pro 1024x1366 dengan formula iPad Mini/Air hingga lebar portrait 1199.98px.

## 2026-08-31 - Perbaikan Posisi Portrait Responsif

- Mengunci containing block portrait tablet/desktop ke section Hero agar posisi tidak mengikuti offset wrapper konten.
- Membatasi ukuran portrait berdasarkan ruang vertikal setelah header pada mobile landscape, tablet/iPad, laptop, dan desktop.
- Memperbaiki typo unit landscape pendek dan menyelaraskan boundary breakpoint di 1024px.

## 2026-08-31 - Penyederhanaan Hero

- Menghapus Availability Card beserta lokasi dan memindahkan status ke metadata About.
- Menyamakan posisi chat tablet ke pojok kanan bawah dan menyesuaikan ukuran trigger per perangkat.

## 2026-08-31 - Pembaruan Social Nav

- Mengganti LinkedIn nonaktif dengan profil X aktif `@yhvnz_` pada sidebar dan menu mobile.

## 2026-08-31 - Refinement Interaksi Navbar

- Mempertahankan glass effect navbar dan mengganti glow putih saat scroll dengan neutral depth shadow.
- Menggunakan aksen tipis serta garis pendek untuk state aktif/hover; item Projects nonaktif tidak lagi memberi feedback interaktif.

## 2026-08-29 - Baseline Final

### Visual dan Layout

- Menetapkan komposisi final berdasarkan referensi light/dark: konten kiri dan portrait dominan kanan.
- Menyelesaikan layout mobile, mobile landscape pendek, tablet, dan desktop.
- Menambahkan glass treatment terukur pada navbar, kartu status, kontrol, dan chat.
- Menambahkan bottom fade agar transisi keluar Hero lebih halus.

### Tema, Bahasa, dan Navigasi

- Menyelesaikan tema terang/gelap dengan preferensi sistem dan persistensi.
- Menyelesaikan pilihan bahasa Indonesia/Inggris beserta copy terstruktur.
- Navbar menjadi fixed, memiliki surface saat scroll, dan adaptif pada viewport sempit.
- Menu mobile memuat navigasi, Guestbook, dan link sosial; header landscape dapat auto-hide.

### Portrait dan Latar

- Menyelesaikan crossfade portrait per tema, entrance, float, dan pointer parallax.
- Mengganti latar dekoratif lama dengan scanner interaktif bertema.
- Menambahkan dukungan reduced motion untuk scanner dan gerak portrait.
- Mengoptimalkan portrait ke AVIF/WebP responsif dengan PNG fallback.
- Light memakai maksimum 1024px; dark 1254px agar tidak terjadi upscale.

### Interaksi dan Aksesibilitas

- Menambahkan status ketersediaan bergilir, dot aktif, dan lokasi Indonesia.
- Menambahkan tooltip dan feedback pada sidebar sosial.
- Menambahkan shell chat "Segera Hadir" dengan dialog responsif dan overflow internal.
- Menambahkan custom cursor glass untuk fine pointer, nonaktif pada touch/reduced motion.
- Menyelesaikan label ARIA, focus state, keyboard menu, dan state nonaktif yang eksplisit.

### Validasi

- Hero final telah melewati typecheck, lint, 26 test, dan production build.
- Dokumentasi Hero diselaraskan dengan UI referensi dan implementasi final.

## 2026-08-29 - Migrasi Dokumentasi

- Aturan visual, stack, dan quality gate yang berulang dipindahkan ke `docs/global/`.
- Enam dokumen Hero dipadatkan menjadi `01-SPEC.md` dan `02-IMPLEMENTATION.md`.
- Reference dan changelog tetap dipertahankan sebagai sumber khusus Hero.

## 2026-08-29 - Background dan Navigasi Global

- Memindahkan scanner dari layer khusus Hero menjadi background fixed global.
- Mempertahankan social rail pada tablet/desktop di seluruh section.
- Menurunkan opacity surface navbar saat scroll agar lebih transparan.

## 2026-08-29 - Glass Navbar Independen

- Menghapus surface navbar full-width saat scroll.
- Mempertahankan logo, navigasi, bahasa, tema, dan menu sebagai kelompok mengambang terpisah.
- Menerapkan state glass scroll pada setiap kelompok secara independen di seluruh breakpoint dan tema.

## 2026-08-29 - Refinement Glass Navbar

- Menghapus seluruh treatment frame pada logo di semua posisi scroll.
- Menurunkan opacity surface pil navigasi, bahasa, tema, dan menu agar benar-benar translucent.
- Menambahkan strip blur-only full-width saat scroll tanpa warna, border, atau shadow.

## 2026-08-29 - Feathered Scroll Blur

- Mengganti toggle blur berbasis threshold dengan interpolasi `scrollY` kontinu.
- Menambahkan mask gradient dan prefiks Safari agar batas bawah blur memudar halus.
- Menegaskan strip tidak memiliki border atau shadow yang membentuk garis visual.

## 2026-08-29 - Unified Section Background

- Memindahkan blur atas menjadi komponen tepi viewport global dan menambahkan blur bawah feathered.
- Menghapus `hero-bottom-fade` yang membentuk garis dan memotong gerak scanner.
- Menyatukan Hero dan About di atas satu scanner fixed tanpa overlay warna pada batas section.

## 2026-08-29 - Blur dan Portrait Transition Fix

- Membatasi backdrop blur ke area strip tepi viewport agar konten Hero tidak ikut ter-blur saat scroll.
- Memindahkan mask vertikal ke shell portrait agar bagian bawah foto memudar gradual dan menyatu dengan About tanpa cutoff.
- Menempatkan titik akhir transparan di dalam batas Hero agar mask tidak lagi terpotong oleh overflow section.
- Menghapus scale overscan dan memberi ruang gerak di atas mask untuk mencegah cutoff horizontal pada rambut.
- Menjadikan portrait statis dan menyelesaikan fade sebelum batas Hero untuk menghilangkan seam tipis antarseksi.
- Menjadikan logo header sebagai link aksesibel ke `#home` untuk kembali ke Hero paling atas.

## 2026-08-30 - Interaksi Global dan Transisi Portrait

- Memulihkan pointer parallax portrait dengan `Hero` sebagai target input dan motion spring pada fine pointer non-mobile.
- Memperpanjang kurva mask bawah portrait agar jas larut gradual ke background tanpa cutoff horizontal atau blur berlebihan.
- Memindahkan input pointer scanner dari canvas ke `window` agar background tetap interaktif meski layer global menggunakan `pointer-events: none`.
- Mengganti blur bawah viewport menjadi tiga layer CSS-only fixed dengan intensitas 2px, 6px, dan 12px serta mask progresif transparan.
- Menghapus backdrop containment khusus blur bawah agar filter membaca page content di belakangnya dan tetap terlihat pada setiap posisi scroll.
- Membuat shell header fixed tembus pointer dan mengaktifkan pointer hanya pada logo, nav/menu, serta kontrol kanan, sehingga CTA di belakang area transparan tetap menerima hover dan click.
- Menambahkan regression test untuk parallax portrait, progressive viewport blur, dan hitbox navbar transparan; seluruh 29 test lulus.

## 2026-08-31 - Availability Scroll Repaint Fix

- Memisahkan surface backdrop blur dari layer entrance content agar teks availability tetap stabil setelah Hero keluar dan kembali masuk viewport.
- Menjeda rotasi status selama card tidak terlihat untuk mencegah transisi teks berjalan offscreen.
- Menambahkan regression test untuk pause dan resume rotasi berdasarkan visibility card.

# Changelog About

## 2026-08-29 - Baseline Final

- Menambahkan section About bergaya editorial tanpa portrait kedua atau kumpulan card.
- Menambahkan heading, narasi, metadata fokus/pendekatan/lokasi, dan tiga prinsip kerja dalam ID/EN.
- Menambahkan layout satu kolom pada mobile dan grid asimetris pada desktop.
- Menambahkan masked heading reveal, entrance ringan, divider stagger, dan reduced motion.
- Menghubungkan navigasi About desktop/mobile ke target `#about`.
- Menambahkan test struktur, locale, navigasi, dan accessibility; seluruh 27 test lulus.

## 2026-08-29 - Interaksi dan Kesinambungan Global

- Menambahkan hover bertema pada label `01 / About Me`.
- Membuat background About transparan agar scanner global tetap hidup.
- Mempertahankan social rail tablet/desktop saat pengguna masuk ke About.
- Menyesuaikan navbar scroll menjadi lebih transparan.

## 2026-08-29 - Transisi Section Menyatu

- Menghapus gradient solid pada batas Hero menuju About.
- Menggunakan scanner global kontinu serta blur feathered di tepi bawah viewport.
- Menetapkan background transparan sebagai pola untuk About dan section berikutnya.

## 2026-08-29 - Label Editorial Interaktif

- Memecah label About menjadi nomor, slash, dan judul dengan entrance stagger yang halus.
- Menambahkan pemanjangan garis, respons slash, pergeseran judul, dan underline sweep untuk fine pointer.
- Mempertahankan semantik non-interaktif, pembacaan aksesibel utuh, touch entrance, dan reduced motion.
- Mengganti pergeseran judul dengan Editorial Ink Fill berbasis token amber light mode dan merah dark mode.
- Menyederhanakan label tanpa garis kiri dan underline; nomor, slash, dan judul kini merespons hover bersama dengan aksen, bobot, dan glow halus.
- Memastikan heading utama kolom kiri selalu terlihat dengan menghapus ketergantungan visibilitasnya pada `whileInView` per baris.
- Menghapus scroll margin About yang menggandakan offset anchor dan membuat landing terlalu rendah.
- Menambahkan active state nav About berbasis posisi section, lengkap dengan class `active` dan `aria-current`.
- Menghapus prefix `01 /` pada label About untuk locale ID dan EN.
- Menunda grid dua kolom hingga 1280px dan menggeser detail ringan ke kanan pada desktop lebar agar konten tidak terpotong atau terlalu rapat.
- Mengganti heading final ID/EN dengan natural wrapping dan aksen khusus pada `kode`/`code` menggunakan token brand.
- Memperlebar porsi kolom heading dan gap desktop tanpa mengecilkan ukuran font baseline.

## 2026-08-30 - Quote Editorial Berbasis Scroll

- Menambahkan quote positioning bilingual EN/ID ke kontrak locale About.
- Menambahkan `AboutQuote` dengan highlight kata demi kata yang mengikuti progress scroll dan dilembutkan menggunakan spring Motion.
- Membatasi aksen quote pada `feel alive`/`terasa hidup`; kata lain memakai teks utama theme-aware dengan opacity progresif.
- Memindahkan quote ke bawah heading pada kolom kiri untuk mengisi ruang editorial tanpa menambah card, statistik, atau dekorasi baru.
- Mempertahankan wrapping natural, hierarchy yang lebih kecil dari heading, dan reduced motion yang langsung menampilkan paragraf penuh.
- Membuat kata `code`/`kode` pada heading italic sekaligus tetap memakai aksen tema.
- Menambahkan test untuk copy kedua bahasa, pemisahan per kata, posisi quote, styling, reduced motion, dan accessibility.

## 2026-08-31 - Surface Glass Editorial

- Menambahkan panel glass terpisah pada metadata dan `How I Work` tanpa mengubah semantik atau urutan konten.
- Mempertahankan tiga metadata serta nomor prinsip `01-03`.
- Mengganti divider merah dengan border netral dan menumpuk judul-deskripsi agar tidak overlap pada desktop.

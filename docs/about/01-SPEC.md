# Spesifikasi About

**Status:** Final  
**Referensi visual:** Tidak digunakan; mengikuti design system dan kesinambungan Hero.

## Tujuan

Menjelaskan profil, cara berpikir, dan nilai profesional Evindo Amanda setelah Hero, tanpa mengulang portrait atau intensitas visual Hero.

## Arah yang Direkomendasikan

- Gaya editorial, tenang, profesional, dan elegan.
- Layout desktop asimetris: heading besar dan quote di kiri; narasi, metadata, dan prinsip kerja di kanan.
- Mobile menjadi satu kolom dengan urutan baca yang jelas.
- Tidak memakai kumpulan card, portrait kedua, skill percentage, statistik, atau scanner tambahan.
- About memakai scanner global yang sama dengan Hero agar background tetap hidup tanpa duplikasi.

## Struktur Konten

1. Label section `TENTANG SAYA` / `ABOUT ME` tanpa prefix nomor.
2. Heading positioning singkat.
3. Narasi personal-profesional ringkas.
4. Metadata faktual, bila disetujui.
5. Tiga prinsip kerja dalam baris bernomor.
6. Quote positioning bilingual yang memperkuat pendekatan terhadap interface dan pengalaman digital.

## Motion

- Judul label masuk selama 350ms tanpa nomor, slash, atau garis dekoratif.
- Label memakai warna teks tema secara default.
- Pada perangkat fine pointer, seluruh label berubah ke aksen tema, sedikit menebal, dan mendapat glow halus tanpa underline atau pergeseran layout.
- Label tetap non-interaktif dengan cursor default; perangkat touch hanya memakai entrance.
- Heading kiri selalu terlihat pada posisi final; pergantian bahasa tetap memakai transisi konten ringan.
- Kata `code`/`kode` pada heading memakai aksen tema dan gaya italic.
- Narasi masuk selama 500ms dengan fade dan translate 16px.
- Prinsip memakai divider netral tanpa garis aksen; entrance setiap baris memakai stagger 80ms.
- Quote memakai highlight kata demi kata yang terhubung dengan progress scroll; progress dilembutkan dengan spring dan dapat bergerak maju atau mundur mengikuti scroll.
- Kata quote yang belum tercapai tetap memakai teks utama dengan opacity rendah; kata `feel alive`/`terasa hidup` saja memakai aksen tema.
- Tidak ada animasi ambient berulang.
- Reduced motion menampilkan quote penuh tanpa highlight progresif.

## Kriteria Selesai

- Terhubung langsung dari Hero tanpa gradient atau garis pemisah; scanner global bergerak kontinu.
- Copy ID/EN faktual dan disetujui.
- Light/dark, mobile, tablet, desktop, keyboard, dan reduced motion bekerja.
- About tidak mengambil scope Skills atau Experience.
- Layout tetap satu kolom sampai tablet/desktop kecil; dua kolom baru aktif mulai 1280px agar heading, deskripsi, metadata, dan prinsip tidak terpotong atau terlalu rapat.
- Heading EN: "I turn design into working code." dengan aksen hanya pada `code`.
- Heading ID: "Saya mengubah desain menjadi kode yang berfungsi." dengan aksen hanya pada `kode`.
- Quote EN: "I turn ideas into interfaces. I don't just build screens — I build experiences that respond, move, and feel alive. Because a great product isn't just seen, it's felt."
- Quote ID: "Saya mengubah ide menjadi antarmuka. Bukan sekadar membangun tampilan, tapi menciptakan pengalaman yang responsif, bergerak, dan terasa hidup. Karena produk yang hebat bukan hanya dilihat, tapi dirasakan."
- Heading memakai natural balanced wrapping tanpa clip atau baris manual; versi ID dan EN harus aman pada mobile, tablet, dan desktop.
- Quote berada di bawah heading pada kolom kiri dengan wrapping natural; ukurannya lebih rendah dari heading dan tidak dipaksa ke jumlah baris tertentu.
- Anchor About mendarat dengan mengandalkan padding section, tanpa scroll margin tambahan yang menggandakan offset header.
- Item navigasi About aktif ketika zona utama section berada di viewport dan kembali nonaktif ketika section ditinggalkan.
- Typecheck, lint, test, dan build lulus.

## Keputusan Final

- Konsep: editorial profile seperti halaman majalah desain.
- Heading final mengikuti locale ID/EN; warna aksen dan italic memakai token brand aktif pada kata `kode`/`code` saja.
- Quote final tersedia dalam ID/EN, berada di bawah heading, dan menyorot `feel alive`/`terasa hidup` dengan aksen tema.
- Metadata: fokus Front-End, pendekatan presisi dan aksesibel, lokasi Indonesia.
- Prinsip: Design to Code, interaksi bermakna, dan performa sejak awal.
- Metadata tetap tiga item: fokus, pendekatan, dan lokasi; tidak perlu item tambahan.
- Metadata dan prinsip kerja memakai panel glass terpisah yang subtil.
- Prinsip mempertahankan nomor `01-03`, divider netral, serta layout dua kolom: nomor di kiri dan konten bertumpuk di kanan agar tidak overlap.
- Copy tersedia dalam ID/EN dan tidak memuat statistik atau klaim pengalaman.
- Implementasi tidak memakai referensi visual tambahan.

# Spesifikasi Experience

**Status:** Final dan menjadi baseline pemeliharaan
**Referensi visual:** Tidak digunakan; mengikuti design system serta kesinambungan About dan Skills.

## Tujuan

Menampilkan pengalaman praktis Evindo Amanda dalam membangun sistem internal untuk usaha milik sendiri secara jujur, ringkas, bilingual, dan profesional tanpa memberi kesan hubungan kerja atau klien eksternal yang tidak ada.

## Konsep Disetujui

- Compact professional timeline dengan satu experience record, bukan timeline pekerjaan yang dipaksakan atau kumpulan card.
- Layout desktop tiga kolom: periode dan konteks di kiri, node serta garis timeline di tengah, lalu role dan kontribusi di kanan.
- Role menjadi elemen tipografi utama dengan skala profesional yang tenang; periode tampil kecil memakai aksen tema.
- Seluruh informasi selalu terbuka tanpa accordion, filter, logo, atau placeholder pengalaman.
- Background transparan agar scanner global tetap berlanjut.
- Struktur dapat menerima pengalaman nyata baru kelak tanpa menampilkan slot kosong sekarang.

## Copy

- Label EN: `EXPERIENCE`.
- Label ID: `PENGALAMAN`.
- Role EN: `Independent Web Developer`.
- Role ID: `Pengembang Web Independen`.
- Context EN: `Internal Business Project`.
- Context ID: `Proyek Internal Usaha`.
- Record title EN/ID: `ALAM BARU`.
- Business description EN: `Custom glass & aluminum fabrication, complemented by ornamental & predator fish retail`.
- Business description ID: `Fabrikasi kaca dan aluminium custom, dilengkapi dengan penjualan ikan hias dan ikan predator`.
- Meta EN: `Internal Dashboard · North Sumatra, Indonesia`.
- Meta ID: `Dashboard Internal · Sumatera Utara, Indonesia`.
- Periode: `Nov 2025 – Present` dalam EN dan `Nov 2025 – Sekarang` dalam ID.

## Konteks Faktual

- Dashboard merupakan satu sistem internal untuk satu usaha milik Evindo Amanda.
- Usaha mencakup penjualan ikan hias, ikan predator, dan perlengkapannya.
- Usaha juga mengolah aluminium dan kaca menjadi produk seperti cermin dan etalase.
- Pengalaman tidak disebut freelance atau pekerjaan klien eksternal.
- Tidak menampilkan metrik, hasil bisnis, teknologi, atau fitur rinci yang belum diverifikasi.

## Area Kontribusi

- Merancang dan mengembangkan dashboard analitik internal yang menyatukan data penjualan, inventaris, dan pelanggan dari seluruh lini produk.
- Mengimplementasikan pemantauan omzet dan laba secara real-time dengan visualisasi tren serta rincian performa setiap kategori.
- Membangun alur pelaporan yang menggantikan pencatatan manual berbasis spreadsheet untuk operasional sehari-hari.
- Padanan EN membawa makna yang sama tanpa menambah klaim.

## Interaksi dan Motion

- Entry bersifat informatif, selalu terbuka, dan tidak berpura-pura sebagai link.
- Entrance memakai fade dan translate vertikal ringan untuk record dan bullet kontribusi.
- Garis timeline muncul secara tenang bersama record; tidak memakai loop atau scroll progress.
- Fine-pointer hover hanya memperjelas node dan garis timeline tanpa glow atau menyiratkan aksi klik.
- Reduced motion menghapus translate dan stagger; seluruh informasi tetap langsung tersedia.
- Konten penting tidak bergantung pada animasi untuk dapat dibaca.

## Responsif

| Rentang       | Perilaku                                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| `<640px`      | Timeline di kiri; periode, role, konteks, dan bullet tersusun dalam satu alur ringkas. |
| `640-1023px`  | Metadata dan detail memakai grid dua sisi dengan node di antaranya.                    |
| `1024-1279px` | Timeline tiga kolom dengan proporsi metadata yang tetap compact.                       |
| `>=1280px`    | Timeline tiga kolom lebar: metadata, rail, dan detail profesional.                     |

- Natural wrapping digunakan untuk role dan deskripsi pada kedua bahasa.
- Section tidak boleh menyebabkan horizontal overflow.
- Padding dan alignment mengikuti About dan Skills.

## Navigasi

- Root section memakai target stabil `#experience` tepat setelah Skills.
- Desktop tidak menambah pill Experience; About tetap active sebagai parent context saat Experience current.
- Mobile menu diurutkan `About`, `Skills`, `Experience`, `Projects`, `Contact`.
- About, Skills, dan Experience merupakan anchor aktif; Projects dan Contact tetap unavailable.
- Saat Experience current, hanya item Experience yang active pada mobile.
- `#experience` tidak memakai scroll margin tambahan; padding section menyediakan offset visual.

## Batas Dengan Projects/Works

- Experience menjelaskan perjalanan, periode, konteks, peran, dan kontribusi tingkat tinggi.
- Projects/Works kelak menjelaskan problem, solusi, fitur, proses, teknologi, screenshot, dan outcome terverifikasi.
- Experience tidak menampilkan screenshot, daftar stack, rincian fitur, gallery, atau case study.
- Tautan menuju Projects tidak ditampilkan sebelum section tujuan tersedia.

## Kriteria Selesai

- Satu experience record tampil dengan fakta dan copy yang disetujui.
- Tidak ada klaim klien eksternal, pekerjaan formal, atau metrik yang tidak tersedia.
- Experience hadir setelah Skills dan terintegrasi dengan active-section navigation.
- Light/dark, ID/EN, keyboard navigation, reduced motion, dan breakpoint utama bekerja.
- Scanner global tetap menyatu dan fixed UI tidak menghalangi informasi.
- Typecheck, lint, test, audit aksesibilitas, dan production build lulus.

## Batas Scope

Case study Projects/Works, screenshot dashboard, detail fitur, teknologi, deployment, dan outcome bisnis tidak termasuk baseline Experience.

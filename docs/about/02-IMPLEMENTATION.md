# Rencana Implementasi About

**Status:** Final dan menjadi baseline pemeliharaan.

## Struktur Minimal

| Bagian                | Tanggung jawab                                            |
| --------------------- | --------------------------------------------------------- |
| `About.tsx`           | Root section, layout, heading hierarchy, dan composition. |
| `AboutPrinciples.tsx` | Tiga prinsip kerja bernomor.                              |
| `AboutQuote.tsx`      | Quote bilingual dan highlight kata berbasis scroll.       |

Narasi dan metadata tetap di `About.tsx` selama belum membutuhkan perilaku terpisah. Hindari komponen wrapper satu kali.

## Data

- Tambahkan kontrak copy About pada locale typed yang sudah ada.
- Sediakan nilai ID dan EN dari copy yang telah disetujui.
- Kontrak `HeroCopy["about"]` memuat `quote` sebagai string terlokalisasi.
- Jangan menambahkan data personal atau statistik tanpa sumber dari pemilik.

## Urutan Kerja

1. Spec, copy, dan metadata disetujui.
2. Type dan locale About ditambahkan.
3. Layout editorial light/dark dibangun.
4. Responsive layout dan transisi dari Hero diselesaikan.
5. Entrance motion dan reduced motion diterapkan.
6. Test, audit aksesibilitas, dan verifikasi standar diselesaikan.

## Batas Teknis

- Gunakan token, stack, easing, dan dependency global yang sudah ada.
- Tidak menambah library, gambar, efek WebGL, atau state global baru.
- Navigasi About memakai target stabil `#about`; item section lain tetap nonaktif sampai tersedia.
- `#about` tidak memakai `scroll-margin-top`; padding atas section sudah menyediakan jarak aman dari header fixed.
- `HeroHeader` mengamati section nav yang tersedia dengan `IntersectionObserver`, lalu menyetel class `active`, `data-active`, dan `aria-current` pada item terkait.
- Root About transparan agar scanner global tetap terlihat.
- Social rail tablet/desktop tetap tersedia saat About berada di viewport.
- Label section hanya memuat judul terlokalisasi; teks `sr-only` mempertahankan pembacaan utuh untuk teknologi asistif.
- Hover label hanya aktif pada `(hover: hover) and (pointer: fine)` dan reduced motion menghapus perpindahan entrance.
- Judul memakai class `about-label-part`: warna default berasal dari `--color-text-primary`, sedangkan hover memakai `--color-accent-500`, font weight 700, dan text shadow berbasis token.
- Grid About menjadi dua kolom mulai breakpoint `xl`; kolom kanan memakai `min-width: 0` dan padding kiri responsif agar detail serta `How I Work` mendapat ruang tanpa overflow.
- Kolom kiri membungkus heading dan `AboutQuote`; pada mobile urutannya heading, quote, lalu detail About.
- Heading disimpan sebagai `before`, `accent`, dan `after` pada locale typed. Komponen merender satu alur teks dengan `text-balance`, tanpa wrapper `overflow-hidden` atau line break manual.
- Fragmen `accent` heading memakai `text-accent-500 italic`, sehingga hanya `code`/`kode` yang menerima aksen dan italic.
- Accessible name heading dibentuk dari ketiga fragmen tanpa spasi punctuation yang keliru; visual fragments ditandai dekoratif agar pembaca layar menerima satu kalimat utuh.
- Grid desktop memberi kolom heading rasio 1,15 dan gap responsif 5-9rem; font size baseline dipertahankan dan ruang tambahan diambil dari kolom detail.
- `dl` metadata dan `ol` prinsip memakai `about-glass-panel` dengan surface transparan, border halus, shadow ringan, dan backdrop blur berbasis token tema.
- Prinsip memakai grid dua kolom mulai `sm`: nomor selebar 3,5rem dan konten bertumpuk; pemisah hanya memakai border netral.
- Baris heading kiri dirender langsung pada state final dan tidak bergantung pada `whileInView`, sehingga tidak dapat tertahan dalam keadaan transparan ketika observer terlambat atau gagal terpicu.
- Quote memakai `useScroll({ target, offset: ["start 0.85", "end 0.35"] })` dan `useSpring` dengan stiffness 70, damping 20, serta mass 0,35 untuk menghaluskan progress.
- Setiap kata memetakan progress overlap ke opacity 0,24-1; kata biasa memakai `--color-text-primary`, sedangkan `feel alive`/`terasa hidup` memakai `--color-accent-500`.
- Quote memakai ukuran responsif `clamp(1.625rem, 2.4vw, 2.5rem)`, lebar maksimum 24ch, wrapping natural, dan jarak `mt-16 sm:mt-20` dari heading.
- Visual word spans ditandai dekoratif dan teks penuh tersedia untuk teknologi asistif. Reduced motion merender paragraf penuh tanpa motion values atau pemisahan visual per kata.

## Pemeliharaan

- Pertahankan layout editorial tanpa portrait atau kumpulan card.
- Perubahan copy harus tetap sinkron pada locale ID/EN.
- Catat revisi final di `CHANGELOG.md` dan jalankan verifikasi standar.

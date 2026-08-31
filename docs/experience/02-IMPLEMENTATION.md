# Rencana Implementasi Experience

**Status:** Final dan menjadi baseline pemeliharaan.

## Struktur

| Bagian                   | Tanggung jawab                                                        |
| ------------------------ | --------------------------------------------------------------------- |
| `Experience.tsx`         | Root section, compact timeline record, contribution list, dan motion. |
| `src/data/experience.ts` | ID dan periode faktual yang tidak diterjemahkan.                      |
| `src/locales/*`          | Copy bilingual untuk konteks, role, record, dan kontribusi.           |

Komponen entry terpisah tidak dibuat selama hanya ada satu record dan tidak ada perilaku reusable.

## Data dan Locale

- Data faktual menyimpan `id`, `startMonth`, dan `startYear`; status ongoing dibentuk melalui copy locale `Present/Sekarang`.
- Tambahkan kontrak `experience` pada `HeroCopy` yang sudah menjadi kontrak dictionary global.
- Locale memuat section label, role, business context, period suffix, record title, business description, meta, dan tiga contribution statements.
- Tidak menambah context, dependency, atau data personal di luar yang disetujui.

## Layout

- Root transparan memakai padding dan alignment yang sama dengan About dan Skills.
- Label section menjadi heading `h2` kecil; tidak memakai display heading pemasaran tambahan.
- Mulai `sm`, record memakai grid metadata, rail, dan detail; mobile memakai rail di kiri dengan konten linear.
- Record tidak memakai border pembungkus, rounded card, atau surface solid.
- Periode memakai ukuran body semibold dengan aksen; role memakai display typography sekitar 20-24px.
- Contribution list menjadi bullet vertikal dengan natural wrapping.
- Tidak ada slot kosong, logo, badge, screenshot, atau CTA menuju section yang belum tersedia.

## Motion

- Gunakan Motion yang sudah tersedia dan easing global.
- Entrance record memakai opacity dan translate maksimal 16px dengan `viewport.once`.
- Contribution items memakai stagger kecil; total entrance tetap sekitar atau di bawah satu detik.
- Reduced motion memakai durasi nol, tanpa translate atau stagger.
- Label heading dirender pada final state tanpa bergantung pada entrance observer.

## Navigasi

- Tambahkan `<Experience />` tepat setelah `<Skills />` di `App`.
- Tambahkan `experience` pada active-section observer.
- Desktop About aktif untuk `about`, `skills`, dan `experience`; tidak menambah pill baru.
- Mobile menu menjadi `about`, `skills`, `experience`, `projects`, `contact`.
- Experience menjadi anchor `#experience`; Projects dan Contact tetap unavailable.

## Testing

- Struktur `section`, anchor, heading, periode, role, record, business description, meta, dan tiga kontribusi.
- Copy EN dan ID sesuai kontrak typed.
- Experience dirender setelah Skills.
- Desktop About parent active saat Experience current.
- Mobile hanya menyorot Experience saat Experience current.
- Projects dan Contact tetap unavailable serta urutan menu sesuai spec.
- Reduced motion, viewport matrix, dan audit accessibility tidak regresi.
- Typecheck, lint, Vitest, dan production build.

## Urutan Kerja

1. Tambahkan data faktual dan kontrak locale.
2. Implementasikan compact professional timeline record.
3. Integrasikan section setelah Skills.
4. Integrasikan observer dan mobile navigation.
5. Tambahkan test struktur, locale, dan active state.
6. Jalankan quality gates.
7. Pertahankan dokumen dan changelog selaras pada revisi yang disetujui.

## Batas Pemeliharaan

- Jangan mengubah Experience menjadi Projects case study.
- Jangan menambah entry, klien, metrik, fitur, atau hasil tanpa fakta dan persetujuan baru.
- Jangan membuat abstraksi multi-entry sebelum terdapat pengalaman kedua yang nyata.
- Catat hanya perubahan baseline atau revisi penting yang telah disetujui pada `CHANGELOG.md`.

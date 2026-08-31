# Rencana Implementasi Skills

**Status:** Final dan menjadi baseline pemeliharaan.

## Struktur

| Bagian               | Tanggung jawab                                                      |
| -------------------- | ------------------------------------------------------------------- |
| `Skills.tsx`         | Root section, heading, filter state, dan composition.               |
| `SkillsFilter.tsx`   | Tablist, roving tabindex, keyboard navigation, dan overflow mobile. |
| `SkillsIndex.tsx`    | Kelompok kategori, filtered rows, dan layout transition.            |
| `SkillIndexItem.tsx` | Logo resmi, nama teknologi, dan Brand Trace Hover.                  |
| `src/data/skills.ts` | Data kategori, teknologi, serta icon metadata typed.                |

`SkillCard.tsx` dari draft matrix lama dihapus saat tidak lagi dipakai; tidak dipertahankan sebagai compatibility layer.

## Data dan Ikon

- `SkillCategory`: `frontend | backend | styling | tools | ai`.
- `SkillFilter`: `all | SkillCategory`.
- `SkillItem`: `id`, `category`, `label`, icon/asset definition, optional `brandColor`, dan optional `themeAware`.
- Category UI menambahkan pseudo-filter `all`; item data tidak menyimpan category `all`.
- Gunakan `simple-icons` untuk logo resmi yang tersedia.
- GitHub memakai SVG resmi dengan `currentColor`, bukan hex hitam brand.
- Motion dan React Bits memakai aset resmi lokal yang divalidasi dari sumber resmi; Figma memakai SVG multicolor resmi lokal.
- React Bits dan Figma ditandai `themeAware` agar trace netral; artwork React Bits tetap monokrom dan artwork Figma tetap multicolor.
- ChatGPT memakai OpenAI Blossom resmi; Codex memakai app icon resmi; Claude, OpenCode, Hermes, dan 9Router memakai product icon resmi lokal.
- Jangan memakai fallback logo generik setelah aset resmi tersedia.

## Locale

- Tambahkan kontrak `skills` pada `HeroCopy`.
- Heading memakai fragmen `before`, `accent`, dan `after`.
- Locale memuat section label, heading, note, tab labels, group labels, filter/panel accessible label, serta copy `View More/Show Less`.
- Nama teknologi tidak diterjemahkan.

## Filter Aksesibel

- Gunakan `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, dan `role="tabpanel"`.
- Hanya tab aktif memiliki `tabIndex=0`.
- Arrow Left/Right memilih dan memindahkan fokus secara melingkar; Home/End menuju ujung.
- Click/touch memilih tab langsung.
- State filter tetap lokal pada `Skills`; tidak menambah context.
- Perubahan filter mereset state expand mobile menjadi collapsed.

## Layout

- Root transparan dengan alignment dan padding yang mengikuti About.
- Grid dua kolom baru aktif pada `xl`: kolom kiri sekitar 0,75fr dan index kanan sekitar 1,25fr.
- Kategori index memakai heading kategori tunggal, divider token border, dan grid item responsif tanpa nomor.
- Item index datar tanpa rounded card besar, angka kategori, deskripsi kategori berulang, atau surface dekoratif.
- Logo 22-26px dan nama memakai font display; label kategori tidak diulang pada setiap item.
- Filter berupa tab teks dengan marker/underline aktif, bukan pill tebal.
- Tablist memakai `flex-nowrap` pada semua breakpoint, spacing ringkas, dan `overflow-x-auto`; `AI Tools` selalu berada di kanan `Tools & Workflow` dalam baris yang sama.
- Pada breakpoint `xl`, filter berada di kolom kanan tepat di atas technical index; pada viewport lebih kecil filter tetap berada sebelum index.
- Saat `All` aktif pada mobile, CSS menyembunyikan item ketiga dan seterusnya per kategori. Tombol `aria-expanded`/`aria-controls` membuka seluruh 19 item; mulai `sm` semua item selalu terlihat dan tombol disembunyikan.
- Brand Trace memisahkan `--skill-brand` untuk warna ikon dan `--skill-trace` untuk rail/wash; logo satu warna memakai warna brand, sedangkan logo multicolor/monokrom theme-aware memakai `--color-text-primary`.
- Motion memakai `color-mix()` antara kuning brand dan teks utama untuk trace light mode, lalu kuning brand asli pada dark mode; aset logo tidak diubah.
- Grid item tetap dua kolom mulai `sm`; tiga kolom tidak dipakai karena panel index desktop berada di kolom kanan section.

## Motion

- Gunakan Motion yang sudah tersedia; jangan menambah animation dependency.
- Entrance memakai `whileInView`, `viewport.once`, opacity, dan translate ringan.
- Pergantian filter memakai `AnimatePresence` dengan durasi sekitar 250ms dan easing global.
- Stagger row maksimal 35ms dan tidak membuat total entrance lebih dari sekitar 1 detik.
- Reduced motion memakai durasi nol dan tanpa translate.

## Navigasi

- Tambahkan `<Skills />` tepat setelah `<About />` di `App`.
- Mobile item Skills mengarah ke `#skills` dengan class visual yang sama seperti item section lain.
- Active-section observer memperlakukan Skills sebagai child About hanya pada desktop pill; mobile Skills aktif sendiri dan About tidak ikut aktif.
- Tidak menambah pill Skills pada desktop.

## Testing

- Struktur heading dan aksen EN/ID.
- Total 19 teknologi dan kategori masing-masing.
- Supabase tanpa status Planned.
- Figma multicolor tersedia pada Tools & Workflow; ESLint, Prettier, dan npm tidak ditampilkan.
- Logo GitHub theme-aware dan Motion/React Bits memakai aset resmi.
- Enam AI Tools memakai aset produk resmi dan dapat difilter sebagai satu kategori.
- Filter All dan setiap kategori, termasuk preview/expand mobile dan reset expand.
- Keyboard tab navigation dan roving tabindex.
- Mobile Skills child navigation dan About parent active state.
- Reduced motion, viewport matrix, dan audit accessibility.
- Typecheck, lint, Vitest, dan production build.

## Urutan Kerja

1. Validasi aset resmi Motion dan React Bits.
2. Tambahkan dependency ikon resmi bila belum tersedia.
3. Tambahkan data typed dan kontrak locale.
4. Implementasikan filter dan technical index.
5. Integrasikan root section dan responsive layout.
6. Integrasikan mobile navigation dan observer parent state.
7. Tambahkan test dan audit aksesibilitas.
8. Jalankan quality gates.
9. Pertahankan dokumen dan changelog selaras pada revisi yang disetujui.

## Verifikasi Baseline

- Typecheck lulus.
- ESLint lulus.
- Seluruh 34 test lulus, termasuk Technical Index, filter keyboard, preview mobile, locale ID, navigasi active state, viewport matrix, reduced motion, dan accessibility.
- Production build Vite lulus.
- Package audit setelah penambahan `simple-icons` tidak menemukan vulnerability.

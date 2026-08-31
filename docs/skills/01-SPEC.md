# Spesifikasi Skills

**Status:** Final dan menjadi baseline pemeliharaan
**Referensi visual:** Tidak digunakan; mengikuti design system serta kesinambungan Hero dan About.

## Tujuan

Menampilkan toolkit yang digunakan Evindo Amanda sebagai technical index editorial yang mudah dipindai, bilingual, aksesibel, responsif, dan profesional tanpa progress percentage atau klaim tingkat keahlian.

## Konsep Final

- Technical Index bergaya ledger, bukan kumpulan card generik.
- Layout desktop asimetris: heading dan note di kiri; filter serta daftar teknologi berkelompok di kanan.
- Setiap item bersifat informatif dengan logo resmi dan nama teknologi; kategori hanya muncul sekali sebagai heading kelompok.
- Background tetap transparan agar scanner global berlanjut tanpa pemisah section.
- Tidak memakai progress bar, rating, persentase, statistik, gradient blob, atau klaim pengalaman.

## Copy

- Label EN: `SKILLS`.
- Label ID: `KEAHLIAN`.
- Heading EN: "Tools and technologies I work with."; aksen hanya pada `technologies`.
- Heading ID: "Tools dan teknologi yang saya gunakan."; aksen hanya pada `teknologi`.
- Note EN: "Always learning, always improving."
- Note ID: "Selalu belajar, selalu berkembang."
- Nama teknologi dan nama kategori produk tidak diterjemahkan.

## Data Awal

| Kategori         | Teknologi                             |
| ---------------- | ------------------------------------- |
| Frontend         | React, TypeScript, JavaScript, HTML   |
| Backend          | Supabase                              |
| Styling & Motion | CSS, Tailwind CSS, Motion, React Bits |
| Tools & Workflow | Vite, Git, GitHub, Figma              |

- Total baseline: 13 teknologi.
- Supabase ditampilkan sebagai toolkit aktif tanpa badge `Planned`.
- GitHub memakai bentuk logo resmi dengan `currentColor` agar kontras pada light dan dark mode.
- Figma memakai aset SVG multicolor resmi; Motion dan React Bits memakai aset resmi lokal.
- Semua logo berasal dari aset resmi atau package ikon resmi; jangan membuat logo interpretatif.

## Interaksi

- Filter: `All/Semua`, `Frontend`, `Backend`, `Styling & Motion`, dan `Tools & Workflow`.
- `All/Semua` aktif secara default.
- Filter memperbarui index tanpa reload atau state global.
- Tab mendukung mouse, touch, `ArrowLeft`, `ArrowRight`, `Home`, dan `End` dengan roving tabindex.
- Item informatif memakai cursor default dan tidak berpura-pura sebagai link.
- Filter memakai Editorial Track Reveal: hover memberi tint aksen dan underline parsial; active memakai teks utama, tint tipis, dan underline penuh.
- Item memakai Brand Trace Hover: rail vertikal dan wash 6% mengikuti warna brand, ikon naik 1px/scale 1,04, dan nama bergeser 2px tanpa berubah warna.
- Tidak ada glow ikon atau divider per item; satu divider netral dipakai per kelompok kategori.
- Pergantian filter memakai fade dan translate ringan; reduced motion mengganti daftar langsung tanpa translate.

## Motion

- Entrance section tenang: label dan heading fade ringan, lalu baris index muncul dengan stagger kecil.
- Entrance hanya berjalan sekali dan total tidak melebihi sekitar 1 detik.
- Filter transition memakai opacity dan translate maksimal 6px tanpa spring memantul.
- Reduced motion menghapus translate dan stagger dekoratif tanpa mengurangi fungsi filter.

## Responsif

| Rentang       | Perilaku                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------- |
| `<640px`      | Satu kolom; filter horizontal scroll; preview All sekitar 7 item dengan expand/collapse. |
| `640-1023px`  | Satu kolom dengan index dua kolom per kategori bila ruang cukup.                         |
| `1024-1279px` | Komposisi satu kolom lebar; index dua kolom.                                             |
| `>=1280px`    | Grid asimetris: heading kiri; filter dan technical index kanan.                          |

- Heading memakai natural wrapping tanpa clip atau line break manual.
- Index tidak boleh menyebabkan horizontal page overflow.
- Padding dan alignment mengikuti About.

## Navigasi

- Root section memakai target stabil `#skills` tepat setelah About.
- Desktop tidak menambah pill Skills; About tetap active sebagai parent context saat Skills current.
- Mobile drawer menampilkan Skills dengan treatment visual yang sama seperti item section lain.
- Item Skills mobile mengarah ke `#skills` dan menjadi satu-satunya item yang active saat Skills current; About tidak ikut mendapat highlight.
- `#skills` tidak memakai scroll margin tambahan; padding section menyediakan offset visual.

## Kriteria Selesai

- Semua 13 teknologi tampil pada kategori yang benar.
- Supabase tidak memakai status Planned.
- Motion dan React Bits memakai aset resmi yang tervalidasi.
- GitHub terbaca pada light dan dark mode.
- Filter dapat digunakan dengan keyboard, mouse, dan touch; active state tidak bergantung pada warna saja.
- Mobile, tablet, desktop, ID/EN, reduced motion, dan scanner global bekerja.
- About tetap active sebagai parent pada desktop saat Skills current; mobile hanya menyorot Skills dan tidak ada pill Skills desktop.
- Typecheck, lint, test, audit aksesibilitas, dan production build lulus.

## Batas Scope

Implementasi backend Supabase, Guestbook, auth, Projects, Experience, dan Contact tidak termasuk baseline Skills.

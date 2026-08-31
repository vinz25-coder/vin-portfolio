# Changelog Skills

## 2026-08-31 - AI Tools

- Menambahkan kategori dan filter `AI Tools` setelah `Tools & Workflow` dengan ChatGPT, Codex, Claude, OpenCode, Hermes, dan 9Router.
- Menggunakan aset produk resmi lokal: OpenAI Blossom untuk ChatGPT, app icon Codex, Claude product mark, serta icon resmi OpenCode, Hermes Agent, dan 9Router.
- Memperbarui baseline menjadi 19 teknologi dalam lima kategori; preview mobile `All` menampilkan dua item per kategori sebelum `View More`.
- Menempatkan tab filter `AI Tools` tepat di samping `Tools & Workflow` dalam satu baris horizontal tanpa wrapping; viewport sempit memakai horizontal scroll.
- Mempertahankan index dua kolom dan memisahkan warna Brand Trace dari warna ikon: logo berwarna mengikuti brand, logo theme-aware memakai warna teks netral, dan trace Motion diperkuat kontrasnya pada light mode tanpa mengubah logo resmi.
- Menghapus ungu representatif dari Figma dan React Bits; Figma mempertahankan logo multicolor, React Bits mempertahankan logo monokrom, dan keduanya memakai divider/wash netral theme-aware.
- Revisi lulus typecheck, ESLint, seluruh 39 test termasuk accessibility audit, dan production build Vite.

## 2026-08-30 - Baseline Technical Index Final

- Menambahkan section `#skills` setelah About sebagai Technical Index editorial transparan dengan layout asimetris dan copy bilingual.
- Menampilkan 13 teknologi dalam empat kategori: React, TypeScript, JavaScript, HTML, Supabase, CSS, Tailwind CSS, Motion, React Bits, Vite, Git, GitHub, dan Figma.
- Menggunakan Simple Icons serta aset resmi lokal Motion, React Bits, dan Figma multicolor; GitHub memakai warna teks theme-aware.
- Menambahkan filter tab aksesibel dengan keyboard, touch, Editorial Track hover/active, dan transition Motion yang menghormati reduced motion.
- Menempatkan filter di kolom kanan pada desktop; mobile `All` menampilkan preview sekitar tujuh item dengan `View More/Show Less` bilingual, sementara tablet/desktop selalu lengkap.
- Menambahkan Brand Trace Hover per teknologi: rail dan wash warna brand, icon lift ringan, nama tetap memakai warna teks theme, tanpa glow atau divider per item.
- Menambahkan hover theme pada label `SKILLS/KEAHLIAN` mengikuti treatment `ABOUT ME`.
- Mengintegrasikan Skills ke navigasi tanpa pill desktop; mobile hanya menyorot Skills saat section current dan About tidak ikut active.
- Baseline lulus typecheck, ESLint, seluruh 34 test, accessibility audit, package audit, dan production build Vite.

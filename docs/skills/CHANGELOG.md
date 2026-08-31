# Changelog Skills

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

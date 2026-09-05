# Changelog Contact

## 2026-09-05

- Revisi styling pemilih jenis proyek sesuai persetujuan: tetap native select, surface dan border lebih tegas, chevron khusus, serta placeholder berwarna sekunder.
- Hover, focus, invalid state, dan option memakai token light/dark global; interaksi keyboard, label, validasi, dan submission tetap dipertahankan.
- Verifikasi: typecheck, lint, 134 test, dan production build lulus. Build memberi peringatan chunk di atas 500 kB.
- Pemeriksaan visual browser/perangkat belum dilakukan; tampilan menu native mengikuti dukungan browser/OS.

### Penggantian Custom Dropdown Disetujui

- Menggantikan revisi native di atas dengan select-only combobox tanpa dependency, sesuai permintaan eksplisit pengguna agar highlight OS tidak lagi muncul.
- Mempertahankan styling trigger sebelumnya; popup solid, teks, active/hover, selected, dan focus memakai token global kedua tema. Selected juga ditandai ikon centang. Popup berada dalam alur form dengan tinggi maksimal 40dvh dan opsi minimal 44px.
- Menambahkan navigasi arrows, Home/End, Enter/Space, Escape, Tab/Shift+Tab, typeahead label lokal, dismiss pointer luar/blur, serta ARIA combobox/listbox dan error. Nilai, payload, hidden input, serta reset setelah sukses tetap sinkron dengan state form.
- Tes Contact diperbarui untuk pilihan custom, error, payload, reset, keyboard, dismiss, serta markup state pada light/dark.
- Verifikasi final: `npm run typecheck`, `npm run lint`, `npx vitest run` (136 tes pada 13 file), `npm run build`, dan `git diff --check` lulus. Typecheck selesai sebelum build. Peringatan chunk >500 kB masih ada.
- Browser visual/perangkat dan screen reader nyata tidak tersedia pada sesi ini; warna aktual, overflow breakpoint, dan pengalaman assistive technology belum diverifikasi secara manual. Tes jsdom memverifikasi interaksi dan markup, bukan rendering visual.

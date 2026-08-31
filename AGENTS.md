# AGENTS.md

## Proyek

Portfolio Evindo Amanda menggunakan React 19, TypeScript, Tailwind CSS v4, dan Vite. Pembangunan dilakukan per section dengan aturan global dan dokumen section yang ringkas.

## Dokumen Wajib Dibaca

Sebelum mengubah kode section:

1. Baca `docs/global/DESIGN-SYSTEM.md`.
2. Baca `docs/global/TECH-STACK.md`.
3. Baca `docs/global/QUALITY-GUARDRAILS.md`.
4. Baca `docs/<section>/01-SPEC.md` dan `02-IMPLEMENTATION.md`.
5. Baca `CHANGELOG.md` dan folder `reference/` section jika tersedia.

## Struktur Dokumentasi

- Global dibuat sekali: design system, tech stack, dan quality guardrails.
- Setiap section memakai `01-SPEC.md` dan `02-IMPLEMENTATION.md`.
- `CHANGELOG.md` dibuat setelah section memiliki baseline final atau revisi yang disetujui.
- Reference bersifat opsional dan hanya dibuat bila aset tersedia.

## Aturan Utama

- Jangan menulis kode section sebelum spec dan open item yang dibutuhkan disetujui.
- Semua warna, tipografi, motion, dependency, dan quality gate mengikuti dokumen global.
- Keputusan unik section harus tercatat di `01-SPEC.md`; detail teknisnya di `02-IMPLEMENTATION.md`.
- Jangan membuat copy, data personal, URL, statistik, atau keputusan desain yang belum disetujui.
- Jangan memperluas scope atau mengubah section lain tanpa instruksi.
- Jika dokumen bertentangan dengan implementasi final, berhenti dan minta keputusan; jangan menebak.

## Workflow

1. Siapkan atau revisi spec dan implementation plan.
2. Minta persetujuan sebelum mulai menulis kode section.
3. Implementasikan sesuai urutan kerja dan berhenti pada blocker nyata.
4. Jalankan verifikasi global dan presentasikan hasil untuk review.
5. Setelah final, perbarui changelog section.

Jangan commit atau push tanpa instruksi eksplisit. Commit harus koheren, tanpa `wip` atau emoji.

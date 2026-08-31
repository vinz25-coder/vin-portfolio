# Tech Stack Global

Dokumen ini menetapkan stack bersama. Section tidak perlu membuat dokumen stack sendiri kecuali mengusulkan penyimpangan.

## Stack Utama

| Area          | Teknologi                                              |
| ------------- | ------------------------------------------------------ |
| UI            | React 19 + TypeScript strict                           |
| Build         | Vite 6                                                 |
| Styling       | Tailwind CSS v4 + CSS custom properties                |
| Motion        | Motion untuk state/interaksi; CSS untuk loop sederhana |
| Ikon          | `lucide-react`                                         |
| State bersama | React Context                                          |
| Testing       | Vitest + Testing Library + jsdom                       |
| Gambar        | `sharp`, AVIF/WebP, responsive image                   |
| Grafis khusus | OGL hanya melalui komponen yang sudah ada              |

## Konvensi

- Tema memakai class `.dark` pada `<html>` dan disimpan di `localStorage`.
- Bahasa memakai dictionary typed, React Context, `localStorage`, dan sinkronisasi `<html lang>`.
- Gunakan semantic HTML dan API browser seperti `IntersectionObserver` sebelum menambah dependency.
- Gunakan `<picture>`, `srcset`, dan `sizes` untuk gambar besar atau responsif.
- Simpan nilai motion bersama di `src/motion/constants.ts`.
- Jangan menambah state manager, library i18n, animation engine, atau UI kit tanpa kebutuhan dan persetujuan eksplisit.

## Verifikasi Standar

```bash
npm run typecheck
npm run lint
npx vitest run
npm run build
```

Jalankan perintah aset tambahan hanya jika aset terkait berubah, misalnya `npm run images:portrait`.

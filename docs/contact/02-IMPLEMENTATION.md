# Rencana Implementasi Contact

## Arsitektur

- Tambahkan React Router dengan route `/` dan `/contact`.
- Pertahankan provider theme dan language di root.
- Gunakan shell bersama untuk scanner, viewport blur, chat, dan custom cursor.
- Render `HeroSidebar` pada Home dan Contact; komponen tetap tersembunyi pada mobile.
- Adaptasikan header yang ada agar route-aware tanpa menduplikasi implementasi menu, bahasa, dan tema.
- Tambahkan pengelolaan scroll/focus serta metadata document untuk perubahan route.

## Komponen dan Data

- Buat page Contact dan komponen form di `src/components/contact/`.
- Tambahkan copy Contact typed ke dictionary EN/ID.
- Tambahkan WhatsApp ke data kanal Contact; social links existing tetap menjadi sumber GitHub, X, Instagram, dan email.
- Gunakan Simple Icons existing untuk ikon brand resmi pada glass tile Direct Channels.
- Gunakan native `<select>` untuk jenis proyek.
- Gunakan state React lokal untuk nilai form, error, dan submission status.

## Kontrak API

- Endpoint: `POST /api/contact`.
- Payload: `name`, `email`, `projectType`, `message`, serta honeypot `website`.
- Validasi ulang seluruh payload dan enum di server.
- Batasi request JSON dan panjang setiap field sebelum memanggil Resend.
- Kirim email plain text dan HTML yang telah di-escape.
- Environment variables: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, dan optional `CONTACT_TO_EMAIL`.
- `CONTACT_TO_EMAIL` fallback ke email portfolio yang telah disetujui.

## Routing dan Deployment

- CTA Home dan menu Contact memakai link client-side ke `/contact`.
- Link antar-section dari Contact kembali ke hash Home.
- Home membaca hash route dan melakukan `scrollIntoView` setelah section tujuan tersedia; target memakai scroll margin agar tidak tertutup fixed header.
- Tambahkan `vercel.json` untuk fallback SPA tanpa menangkap `/api/*`.
- Route transition mengembalikan scroll ke atas dan memberi focus pada main Contact.

## Verifikasi

- Test render Home dan Contact secara terpisah.
- Test wiring CTA, state aktif nav, kanal langsung, dan copy bilingual.
- Test client validation, loading, success, error, serta submit ganda.
- Test handler API untuk invalid payload, honeypot, dan delivery result dengan boundary yang dapat dimock.
- Periksa keyboard, live region, reduced motion, axe, dan overflow pada breakpoint utama.
- Jalankan `npm run typecheck`, `npm run lint`, `npx vitest run`, dan `npm run build`.

## Konfigurasi Deployment

- Verifikasi domain pengirim di Resend sebelum mengaktifkan production submission.
- Set `RESEND_API_KEY` dan `CONTACT_FROM_EMAIL` pada Vercel, bukan file repository.
- Set `CONTACT_TO_EMAIL` hanya jika inbox penerima berbeda dari default yang disetujui.

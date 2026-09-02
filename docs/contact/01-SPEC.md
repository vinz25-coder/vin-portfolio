# Spesifikasi Contact

**Status:** Disetujui untuk implementasi pada 2026-09-02

## Tujuan

Menyediakan halaman `/contact` tersendiri untuk inquiry proyek melalui form yang ringkas, sekaligus memberi jalur kontak langsung tanpa mengganggu fokus utama halaman.

## Komposisi Disetujui

- Halaman hanya memiliki top navigation, main Contact, dan Footer sebagai region konten.
- Scanner background, viewport edge blur, custom cursor, serta chat/Guestbook tetap global.
- Social rail tetap tampil pada halaman Contact untuk tablet dan desktop.
- Desktop memakai grid editorial asimetris: pengantar dan kanal langsung di kiri, form di kanan.
- Mobile memakai satu kolom dengan urutan pengantar, form, kanal langsung, lalu Footer.
- Form tidak memakai card solid; pemisahan berasal dari ruang kosong, border tipis, dan surface transparan terukur.
- Footer memakai komponen final yang sudah ada tanpa navigasi, social links, atau CTA tambahan.

## Konten dan Kanal

- Label section hanya memakai `CONTACT`/`KONTAK` dan mengikuti hover accent label About, Skills, serta Experience.
- Heading English: `LET'S BUILD SOMETHING USEFUL.`.
- Heading Indonesia: `MARI BANGUN SESUATU YANG BERGUNA.`.
- Form terdiri dari nama, email, jenis proyek, dan pesan.
- Jenis proyek: Web Product, Dashboard, Frontend Implementation, dan Other beserta terjemahannya.
- Kanal langsung memakai email, WhatsApp `+62 899-9925-053`, GitHub, X, dan Instagram yang telah disetujui.
- Kanal langsung memakai glass tile tanpa divider/underline theme, outline warna brand, serta badge ikon terang dengan warna penuh masing-masing platform.
- WhatsApp memakai pesan pembuka sesuai bahasa aktif.
- Alamat penerima form memakai `evindoamandariza@gmail.com`.

## Navigasi

- CTA `Get in touch` pada `WorkWithMe` dan item Contact menuju `/contact`.
- Logo pada Contact menuju `/`.
- Link section dari Contact memakai `/#about`, `/#skills`, dan `/#experience`.
- Perpindahan dari Contact ke section Home memakai navigasi client-side tanpa reload dan melakukan scroll ke section tujuan setelah Home dirender.
- Top navigation desktop/tablet hanya menampilkan About dan Projects; Contact tidak ditampilkan di pill navigation.
- Contact tetap tersedia pada menu mobile dan memiliki state aktif serta `aria-current="page"` di sana.
- Projects tetap eksplisit nonaktif sampai destination tersedia.
- Language switch dan theme toggle tetap tersedia.

## Form dan Feedback

- Nama wajib dan maksimal 80 karakter.
- Email wajib, valid, dan maksimal 254 karakter.
- Jenis proyek wajib berasal dari pilihan yang disetujui.
- Pesan wajib, minimal 20 karakter, dan maksimal 2.000 karakter.
- Submit memiliki state idle, loading, success, dan error serta mencegah submit ganda.
- Error tidak menghapus input pengguna; success mengosongkan form.
- Feedback tampil inline melalui live region, bukan toast saja.
- Email langsung menjadi fallback jika pengiriman gagal.

## Theme, Motion, dan Responsif

- Seluruh warna memakai token global untuk light dan dark theme.
- Entrance cukup fade dan translate ringan; form bergerak sebagai satu grup.
- Reduced motion menghapus translate, stagger, dan motion dekoratif.
- Breakpoint mengikuti global: mobile `<640px`, tablet `640-1023px`, dan desktop `>=1024px`.
- Mobile landscape pendek tidak memakai tinggi fixed atau internal page scroll.
- Chat tidak boleh menutup tombol submit maupun feedback form.

## Aksesibilitas

- Contact mempunyai satu `<h1>` dan main target untuk focus route.
- Semua kontrol memiliki label terlihat, focus state, autocomplete yang sesuai, dan error yang terhubung melalui `aria-describedby`.
- State invalid memakai `aria-invalid`; status sukses memakai `role="status"` dan kegagalan memakai `role="alert"`.
- Urutan tab mengikuti urutan visual dan seluruh kanal dapat digunakan tanpa hover.

## Submission dan Privasi

- Form dikirim ke Vercel Function melalui `POST /api/contact` dan diteruskan melalui Resend.
- API key dan alamat pengirim Resend hanya berada di environment variable server.
- Alamat email pengguna dipakai sebagai `replyTo`, bukan `from`.
- Baseline antispam memakai honeypot, validasi server, batas body/input, dan respons error generik.
- Data digunakan hanya untuk merespons inquiry dan tidak dibagikan kepada pihak lain.

## Kriteria Selesai

- Direct URL `/contact` dan browser back/forward bekerja pada Vercel.
- Home tetap mempertahankan komposisi dan perilaku yang sudah disetujui.
- Light/dark, ID/EN, keyboard, reduced motion, mobile landscape, dan breakpoint utama bekerja.
- Submission success/error dapat diakses dan tidak mengekspos konfigurasi server.
- Typecheck, lint, test, dan production build lulus.

## Batas Scope

Contact tidak menambahkan upload attachment, CAPTCHA visual, budget, target waktu, booking calendar, penyimpanan database, atau dependency UI baru.

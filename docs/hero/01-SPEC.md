# Spesifikasi Hero

**Status:** Final  
**Referensi:** `docs/hero/reference/hero-reference-light.png` dan `hero-reference-dark.png`

## Tujuan

Memperkenalkan Evindo Amanda sebagai pengembang front-end melalui komposisi editorial yang kuat, responsif, bilingual, aksesibel, dan konsisten pada tema terang maupun gelap.

## Komposisi Final

- Header fixed terdiri dari kelompok mengambang independen: logo, navigasi, bahasa ID/EN, dan tema.
- Saat scroll, setiap kelompok mempertahankan glassmorphism sendiri tanpa surface full-width penghubung.
- Navbar memakai depth shadow netral tanpa glow; state aktif dan hover ditandai aksen tipis serta indikator garis pendek.
- Logo tidak pernah mendapat frame, background, border, atau blur pada posisi scroll mana pun; logo menjadi link kembali ke Hero paling atas.
- Strip full-width menginterpolasi opacity dan blur secara kontinu berdasarkan posisi scroll.
- Batas bawah strip memakai mask gradient agar blur memudar tanpa garis keras; strip tetap tanpa warna, border, atau shadow.
- Konten utama: profesi, nama, deskripsi, CTA karya, dan CTA CV.
- Portrait dominan dengan aset rim-light per tema, crossfade, dan pointer parallax ringan pada desktop/fine pointer.
- Bagian bawah portrait memakai mask gradient gradual hingga transparan agar membaur ke About tanpa cutoff.
- Sidebar sosial tetap tampil di seluruh section pada tablet/desktop; sosial masuk ke menu pada layar ringkas.
- Kartu status berisi pesan bergilir dan lokasi Indonesia.
- Scanner interaktif global yang merespons posisi pointer tanpa menangkap input, blur tepi viewport, chat shell, dan custom cursor.
- Batas Hero ke section berikutnya transparan tanpa gradient warna solid agar gerak scanner tidak terpotong.

## Responsif

| Kondisi          | Perilaku                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Mobile           | Satu kolom; konten, portrait, lalu kartu status; navigasi memakai menu. |
| Landscape pendek | Layout dipadatkan dan header bersembunyi saat scroll turun.             |
| Tablet           | Dua kolom, navigasi ringkas, dan social rail.                           |
| Desktop          | Konten kiri dan portrait dominan kanan mengikuti referensi.             |

## Motion Khusus

- Entrance bertahap memakai easing global.
- Crossfade portrait 450ms; 200ms pada reduced motion.
- Portrait memakai pointer parallax ringan dengan spring pada fine pointer non-mobile; posisi kembali ke nol saat pointer keluar.
- Status berganti setiap 3,5 detik.
- Scanner, ping status, dan cursor dinonaktifkan saat reduced motion.
- Reduced motion dan viewport mobile menonaktifkan parallax portrait.

## Batas Scope

Halaman tujuan navigasi, Guestbook aktif, autentikasi Google, dan backend chat belum termasuk Hero.

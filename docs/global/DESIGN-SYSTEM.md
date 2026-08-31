# Design System Global

Dokumen ini menjadi sumber visual dan motion bersama untuk seluruh portfolio. Keputusan khusus section tetap ditulis di `docs/<section>/01-SPEC.md`.

## Identitas Visual

- Gaya utama: editorial, presisi, profesional, dan elegan.
- Gunakan hierarki tipografi, grid asimetris, dan ruang kosong; hindari kumpulan card generik.
- Tema terang memakai dasar krem dengan aksen amber; tema gelap memakai dasar hitam dengan aksen merah.
- Glass effect hanya untuk elemen yang membutuhkan pemisahan atau interaksi, bukan dekorasi massal.
- Scanner bertema menjadi background global yang tetap hidup di seluruh section.
- Semua section memakai background transparan agar scanner tidak terputus pada batas section.
- Blur feathered fixed di tepi atas dan bawah viewport memberi kedalaman tanpa warna, border, shadow, atau garis keras.
- Scrollbar global mempertahankan perilaku native dengan track transparan, thumb netral yang ramping, dan aksen tema saat hover; hindari glow, gradient, serta animasi dekoratif.
- Setiap section harus terasa satu sistem, tetapi boleh memiliki ritme dan komposisi sendiri.

## Token Inti

| Token         | Terang    | Gelap     |
| ------------- | --------- | --------- |
| Latar         | `#FEFAF6` | `#010104` |
| Permukaan     | `#FEFAF2` | `#0B090C` |
| Border        | `#EDE4D6` | `#231A1C` |
| Teks utama    | `#43403E` | `#F5F5F4` |
| Teks sekunder | `#635F5B` | `#B0AFAE` |
| Teks navigasi | `#56534F` | `#D3D4D3` |
| Aksen         | `#E0A553` | `#E9333D` |

Gunakan CSS custom properties yang sudah ada. Warna turunan dibuat dengan token atau `color-mix()`; warna baru harus didokumentasikan dan memiliki pasangan kedua tema.

## Tipografi

- Display: General Sans.
- Body dan UI: Inter.
- Heading memakai tracking rapat dan line-height padat; body mengutamakan keterbacaan.
- Batasi panjang paragraf sekitar 55-70 karakter per baris.
- Jangan memakai lebih dari dua keluarga font tanpa revisi design system.

## Layout Responsif

| Rentang      | Prinsip                                                 |
| ------------ | ------------------------------------------------------- |
| `<640px`     | Satu kolom, urutan konten jelas, target sentuh memadai. |
| `640-1023px` | Tablet; pertahankan hierarki tanpa memaksakan desktop.  |
| `>=1024px`   | Desktop; grid dapat asimetris dan lebih ekspresif.      |

- Gunakan alignment dan padding Hero sebagai acuan kesinambungan antarseksi.
- Jangan menambahkan gradient penutup atau warna solid pada batas antarseksi; kesinambungan berasal dari background global dan spacing.
- Uji portrait, landscape pendek, tablet, desktop, dan lebar fraksional di sekitar breakpoint.
- Hindari tinggi fixed yang menyebabkan overflow; gunakan `svh`/`dvh` bila relevan.

## Motion

- Easing utama: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Gunakan motion untuk menjelaskan hierarki, perubahan state, atau feedback.
- Entrance section cukup fade, masked reveal, atau translate ringan; jangan mengulang intensitas Hero.
- Loop dekoratif hanya memakai transform dan opacity.
- `prefers-reduced-motion` wajib menghapus gerak dekoratif dan mempertahankan fungsi.
- Nilai khusus section harus dicatat di `01-SPEC.md` section tersebut.

## Aksesibilitas Visual

- Semua teks dan kontrol harus terbaca pada kedua tema.
- Focus state harus terlihat dan memakai aksen tema.
- Informasi tidak boleh disampaikan melalui warna saja.
- Dekorasi tidak boleh mengurangi kontras atau menghalangi interaksi.

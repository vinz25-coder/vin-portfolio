# Changelog Footer

## 2026-09-03 - Optimasi Pointer High-Refresh

- Mengurangi beban frame particle wordmark dengan batas partikel adaptif, kalkulasi interaksi sekali per frame, dan penghapusan layout read dari `pointermove`.
- Menormalkan respons particle terhadap durasi frame agar motion konsisten pada layar 60 Hz hingga high-refresh.

## 2026-09-02 - Keterbacaan Wordmark Mobile

- Memperjelas `EVINDO AMANDA.` pada mobile portrait dengan profil particle yang lebih tajam: glyph lebih ringan, partikel lebih kecil, glow lebih rendah, dan idle drift lebih tenang.
- Mempertahankan profil particle semula mulai breakpoint tablet.

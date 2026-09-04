import type { HeroCopy } from "./types";

// TODO(owner): PRD §13 Q5 — needs real Indonesian copywriting review.
// This draft keeps the language switch testable but remains provisional until sign-off.
export const id = {
  eyebrow: "Pengembang Front-End",
  subtitleLines: [
    "Spesialis front-end, mengubah desain menjadi kode yang presisi.",
  ],
  cta: {
    projects: "Lihat Karya Saya",
    contact: "Lihat CV",
  },
  nav: {
    about: "Tentang",
    projects: "Proyek",
    skills: "Keahlian",
    experience: "Pengalaman",
    contact: "Kontak",
  },
  availability: {
    statusLabel: "Status",
    messages: [
      "Mari berkolaborasi",
      "Terbuka untuk bekerja",
      "Terbuka untuk peluang",
      "Terbuka untuk freelance",
    ],
    busy: "Sedang sibuk",
    unavailable: "Sedang tidak tersedia",
  },
  chat: {
    openLabel: "Buka pratinjau Buku Tamu",
    closeLabel: "Tutup pratinjau Buku Tamu",
    title: "Pratinjau Buku Tamu",
    guestbook: "Buku Tamu",
    discussions: "Diskusi",
    reviews: "Ulasan",
    loading: "Memuat percakapan terbaru...",
    emptyDiscussions: "Belum ada diskusi.",
    emptyReviews: "Belum ada ulasan.",
    error: "Pratinjau tidak dapat dimuat.",
    openGuestbook: "Buka Buku Tamu",
  },
  a11y: {
    primaryNavigation: "Navigasi utama",
    homeLink: "Evindo Amanda — Beranda",
    socialSidebar: "Profil sosial",
    portraitAlt: "Potret Evindo Amanda mengenakan jas hitam dan dasi",
    languageMenuLabel: "Pilih bahasa. Bahasa saat ini: Indonesia",
    selectEnglish: "Ganti bahasa ke Inggris",
    selectIndonesian: "Ganti bahasa ke Indonesia",
    openNavigationMenu: "Buka menu navigasi",
    closeNavigationMenu: "Tutup menu navigasi",
    switchThemeToLight: "Ganti ke tema terang",
    switchThemeToDark: "Ganti ke tema gelap",
  },
  about: {
    sectionLabel: "Tentang Saya",
    heading: {
      before: "Saya mengubah desain menjadi",
      accent: "kode",
      after: "yang berfungsi.",
    },
    body: [
      "Saya adalah front-end developer yang berfokus mengubah desain menjadi pengalaman digital yang responsif, aksesibel, dan terasa natural saat digunakan.",
      "Bagi saya, kualitas sebuah antarmuka tidak hanya terlihat dari tampilannya, tetapi juga dari detail interaksi, performa, dan cara setiap elemen bekerja bersama.",
    ],
    quote:
      "Saya mengubah ide menjadi antarmuka. Bukan sekadar membangun tampilan, tapi menciptakan pengalaman yang responsif, bergerak, dan terasa hidup. Karena produk yang hebat bukan hanya dilihat, tapi dirasakan.",
    meta: [
      { label: "Fokus", value: "Front-End" },
      { label: "Pendekatan", value: "Presisi & Aksesibel" },
      { label: "Lokasi", value: "Sumatera Utara, Indonesia" },
    ],
    principlesLabel: "Cara saya bekerja",
    principles: [
      {
        title: "Design to Code",
        description:
          "Menerjemahkan desain menjadi antarmuka yang presisi dan terawat.",
      },
      {
        title: "Interaksi Bermakna",
        description:
          "Menggunakan motion dan feedback untuk memperjelas pengalaman.",
      },
      {
        title: "Performa Sejak Awal",
        description:
          "Memikirkan kecepatan, responsivitas, dan akses sejak awal.",
      },
    ],
  },
  skills: {
    sectionLabel: "Keahlian",
    heading: {
      before: "Tools dan",
      accent: "teknologi",
      after: "yang saya gunakan.",
    },
    note: "Selalu belajar, selalu berkembang.",
    tabs: {
      all: "Semua",
      frontend: "Frontend",
      backend: "Backend",
      styling: "Styling & Motion",
      tools: "Tools & Workflow",
      ai: "AI Tools",
    },
    groups: {
      frontend: "Frontend",
      backend: "Backend",
      styling: "Styling & Motion",
      tools: "Tools & Workflow",
      ai: "AI Tools",
    },
    filterLabel: "Filter keahlian berdasarkan kategori",
    panelLabel: "Indeks teknis keahlian",
    viewMore: "Lihat Selengkapnya",
    showLess: "Sembunyikan",
  },
  experience: {
    sectionLabel: "Pengalaman",
    present: "Sekarang",
    role: "Pengembang Web Independen",
    context: "Proyek Internal Usaha",
    recordTitle: "ALAM BARU",
    businessDescription:
      "Fabrikasi kaca dan aluminium custom, dilengkapi dengan penjualan ikan hias dan ikan predator",
    meta: "Dashboard Internal · Sumatera Utara, Indonesia",
    contributions: [
      "Merancang dan mengembangkan ALAM BARU, dashboard analitik internal yang menyatukan data penjualan, inventaris, dan pelanggan dari seluruh lini produk.",
      "Mengimplementasikan pemantauan omzet dan laba secara real-time dengan visualisasi tren serta rincian performa setiap kategori.",
      "Membangun alur pelaporan yang menggantikan pencatatan manual berbasis spreadsheet untuk operasional usaha sehari-hari.",
    ],
  },
  workWithMe: {
    eyebrow: "Mari bangun sesuatu",
    heading: "Bekerja dengan saya",
    description:
      "Saya tersedia untuk proyek terpilih — produk web, dashboard, dan pekerjaan frontend yang berfokus pada produk.",
    getInTouch: "Hubungi saya",
    emailDirectly: "Email langsung",
  },
  contact: {
    eyebrow: "Kontak",
    heading: {
      before: "Mari bangun sesuatu yang",
      accent: "berguna.",
    },
    introduction:
      "Punya ide produk web, dashboard, atau implementasi frontend? Ceritakan konteksnya dan saya akan menghubungi Anda secara langsung.",
    formHeading: "Konsultasi Proyek",
    fields: {
      name: "Nama",
      namePlaceholder: "Nama Anda",
      email: "Email",
      emailPlaceholder: "anda@example.com",
      projectType: "Jenis proyek",
      projectPlaceholder: "Pilih jenis proyek",
      message: "Pesan",
      messagePlaceholder: "Ceritakan proyek, tujuan, dan konteksnya saat ini.",
    },
    projectTypes: {
      webProduct: "Produk Web",
      dashboard: "Dashboard",
      frontendImplementation: "Implementasi Frontend",
      other: "Lainnya",
    },
    submit: "Kirim pesan",
    submitting: "Mengirim...",
    success: "Pesan berhasil dikirim. Terima kasih telah menghubungi saya.",
    error:
      "Pesan belum berhasil dikirim. Coba kembali atau kirim melalui email langsung.",
    deliveryUnavailable:
      "Layanan pengiriman email belum dikonfigurasi. Silakan gunakan salah satu kanal langsung.",
    validation: {
      name: "Masukkan nama Anda.",
      email: "Masukkan alamat email yang valid.",
      projectType: "Pilih jenis proyek.",
      message:
        "Ceritakan sedikit lebih banyak tentang proyek Anda (minimal 20 karakter).",
    },
    directHeading: "Kanal langsung",
    privacy: "Data Anda hanya digunakan untuk merespons inquiry ini.",
    whatsappMessage:
      "Halo Evindo, saya menemukan portfolio Anda dan ingin mendiskusikan sebuah proyek.",
  },
  guestbook: {
    sectionLabel: "Buku Tamu",
    heading: {
      before: "Perspektif",
      accent: "Pengunjung.",
    },
    description:
      "Kesan, masukan, dan percakapan yang dibagikan oleh pengunjung portfolio ini.",
    rating: {
      overall: "Rating keseluruhan",
      reviews: "ulasan",
      empty: "Belum ada ulasan",
    },
    composer: {
      heading: "Tulis komentar",
      discussion: "Diskusi",
      review: "Ulasan",
      placeholder: "Bagikan pendapat Anda...",
      rate: "Beri rating pengalaman Anda",
      emoji: "Tambahkan emoji",
      image: "Tambahkan gambar",
      removeImage: "Hapus gambar",
      post: "Kirim komentar",
      posting: "Mengirim...",
      signInPrompt: "Masuk dengan Google untuk bergabung dalam percakapan.",
      signIn: "Masuk dengan Google",
      signOut: "Keluar",
      required: "Bagikan pendapat Anda sebelum mengirim.",
      ratingRequired: "Pilih rating dari 1 sampai 5 bintang.",
      imageInvalid:
        "Gunakan satu gambar JPEG, PNG, atau WebP berukuran maksimal 5 MB.",
    },
    filters: {
      label: "Filter komentar buku tamu",
      all: "Semua Komentar",
      discussions: "Diskusi",
      reviews: "Ulasan",
      newest: "Terbaru",
      popular: "Populer",
      highestRated: "Rating Tertinggi",
    },
    feed: {
      empty: "Belum ada percakapan. Jadilah yang pertama membagikan pendapat.",
      loading: "Memuat percakapan...",
      error: "Percakapan tidak dapat dimuat.",
      loadMore: "Muat lainnya",
      reply: "Balas",
      share: "Bagikan",
      report: "Laporkan",
      edit: "Edit",
      delete: "Hapus",
      deleted: "Konten ini telah dihapus.",
      pinned: "Disematkan",
      author: "Penulis",
      edited: "Diedit",
      signInAction: "Masuk untuk melanjutkan",
      reportHeading: "Laporkan konten",
      reportNote: "Detail opsional",
      cancel: "Batal",
      submitReport: "Kirim laporan",
    },
    sidebar: {
      contributors: "Kontributor Teratas",
      noContributors: "Kontributor akan tampil setelah percakapan pertama.",
      statistics: "Statistik Pengunjung",
      totalVisitors: "Total pengunjung",
      totalComments: "Total komentar",
      todayVisitors: "Pengunjung hari ini",
      thisWeek: "Minggu ini",
      guidelines: "Panduan Komunitas",
      guidelinesItems: [
        "Bersikaplah sopan dan baik kepada orang lain.",
        "Dilarang melakukan spam atau promosi diri.",
        "Pastikan diskusi tetap relevan dengan portfolio.",
        "Gunakan @mention untuk menanggapi seseorang.",
        "Laporkan konten yang tidak pantas.",
      ],
      guidelinesThanks:
        "Terima kasih telah menjaga komunitas ini tetap positif.",
    },
    configuredNote:
      "Buku Tamu siap dan akan terhubung setelah environment Supabase dikonfigurasi.",
    success: "Pembaruan Anda telah dipublikasikan.",
    failure: "Terjadi kesalahan. Silakan coba kembali.",
  },
  footer: {
    location: "SUMATERA UTARA, INDONESIA",
  },
} satisfies HeroCopy;

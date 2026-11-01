<div align="center">

# 🌌 Portofolio Semesta — Amboyy

**Website portofolio pribadi bertema dark universe — lengkap dengan mini game arcade di dalamnya.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![No Framework](https://img.shields.io/badge/Framework-Vanilla-8b5cf6?style=flat-square)

🔗 **Live:** [emil-02.github.io/Web_Amboyy](https://emil-02.github.io/Web_Amboyy/)

</div>

---

## ✨ Fitur

### 🪐 Website

- **Starfield canvas** — ratusan bintang berkelip dengan parallax mengikuti kursor + shooting star
- **Planet CSS murni** dengan cincin berputar, bulan yang mengorbit, dan astronot melayang
- Nebula glow beranimasi, efek ketik di hero, reveal saat scroll, counter animasi
- **Galeri proyek** dengan screenshot asli, filter Web / Mobile / AI, dan dialog detail (masalah → solusi → fitur)
- **Form kontak** yang benar-benar sampai: kirim via WhatsApp atau email (opsional Formspree)
- **NOVA** — asisten AI portofolio; otomatis beralih ke jawaban lokal bila server AI tak terjangkau
- Responsif penuh — desktop, tablet, dan HP (menu hamburger)

### 🕹️ Mini Game: Astro Dodge

- Kemudikan roket, hindari **meteor & masalah developer** (🐞 Bug, 🚫 404 Error, 🖥️ Server Down, 💾 Memory Leak)
- **Power-up tech stack**: ⚡ JavaScript speed boost · 🛡️ Shield · 🐍 Python slow-motion · 🔥 Firebase Blast
- **Papan peringkat global** (Firebase Firestore, sinkron live) dengan podium 🥇🥈🥉 — nama pilot terikat ke pemiliknya & skor divalidasi Security Rules
- **Kartu skor 1080×1920** siap unggah ke IG/WA Story + **link tantangan** (`?challenge=SKOR&from=NAMA#game`)
- Gerakan mulus di layar 60/90/120 Hz (fixed timestep + interpolasi), tajam di layar HiDPI, jeda otomatis saat pindah tab
- **Lencana pilot**: 🌌 Master Galaksi (≥1.000) · 🌠 Master Universe (≥3.000) · 🌀 Master Multiverse (≥5.000) · 👑 Legend (≥10.000) · 🧹 Pembersih Langit
- Kontrol keyboard (⬅️➡️ / A-D) dan sentuh untuk HP
- ...dan konon ada yang tersembunyi di dalamnya. 🛸

## 🚀 Menjalankan Secara Lokal

Tanpa build tool, tanpa dependency — cukup:

```bash
git clone https://github.com/Emil-02/Web_Amboyy.git
cd Web_Amboyy
# buka index.html langsung di browser, atau pakai Live Server
```

## 📁 Struktur

```
Web_Amboyy/
├── index.html        # Struktur halaman
├── css/style.css     # Tema dark universe + semua animasi
├── js/config.js      # ⚙️ Kontak, endpoint NOVA, analytics — ubah di sini
├── js/script.js      # Starfield, interaksi, proyek, form kontak
├── js/game.js        # Astro Dodge (dimuat saat bagian game mendekati layar)
├── js/firebase.js    # Papan peringkat global (Firestore + Anonymous Auth)
├── js/ai-chat.js     # Widget NOVA + jawaban cadangan lokal
├── firestore.rules   # Security Rules papan peringkat (wajib di-deploy)
├── worker/           # Backend NOVA (Cloudflare Worker)
└── img/              # Aset gambar (WebP)
```

## 🔐 Papan Peringkat Global — Setup Sekali

1. Firebase Console → **Authentication → Sign-in method → Anonymous → Enable**.
2. Deploy rules dari root repo:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```

Tanpa langkah ini papan tetap tampil, tetapi skor bisa dipalsukan.

## 📊 Analytics (opsional)

Isi `analytics.cloudflareToken` atau `analytics.goatcounterCode` di `js/config.js`. Pakai link berbeda per platform (mis. `?ref=tiktok`, `?ref=ig`) agar terlihat konten mana yang paling banyak mendatangkan pengunjung.

## 🧑‍🚀 Tentang

Dibuat oleh **Amboyy** ([@Emil-02](https://github.com/Emil-02)) — mahasiswa Informatika Unismuh Makassar.

> ✦ _Debug your past, compile your future._ ✦

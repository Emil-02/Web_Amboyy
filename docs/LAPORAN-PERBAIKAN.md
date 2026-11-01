# 📋 Laporan Perbaikan Web_Amboyy

**Tanggal:** 1 November 2026
**Cakupan:** perbaikan bug, performa, konten proyek, keamanan papan peringkat, dan kehalusan game Astro Dodge.

---

## 1. Ringkasan

| Area | Sebelum | Sesudah |
|---|---|---|
| Form kontak | Pesan **tidak pernah terkirim** (mode demo, tapi menampilkan "Sinyal terkirim!") | Pesan dikirim lewat **WhatsApp** atau **email**; validasi input; opsi Formspree |
| NOVA (chatbot) | Diam/gagal bila `*.workers.dev` diblokir ISP (terverifikasi pada jaringan XL) | Timeout 6 detik → **jawaban lokal otomatis**; bisa memakai beberapa endpoint |
| Ikon kontak | Ikon rusak `�` | Diperbaiki + kartu Email, WhatsApp, Instagram, GitHub |
| Ukuran halaman awal | ±1,36 MB (avatar NOVA 1,2 MB) | **±165 KB** file sendiri (avatar 5 KB, game & Firebase dimuat belakangan) |
| Font Google | 3 keluarga (Space Grotesk, Poppins, Orbitron) | 2 keluarga (Poppins, Orbitron) |
| Kartu proyek | Emoji saja; 4 dari 6 tautan hanya ke profil GitHub | Screenshot asli, filter Web/Mobile/AI, dialog detail, 9 proyek, label "Kode privat" yang jujur |
| Keahlian | Bar persentase (85%, 88% …) | Stack teknologi + "Dipakai di proyek X" |
| Papan peringkat | Siapa pun bisa menulis skor/nama apa pun (**terbukti**: tulis tanpa login diterima) | Login anonim + nama terikat pemilik + validasi skor berbasis jam server (`firestore.rules`) |
| Game | Fixed timestep tanpa interpolasi, kanvas buram di HP, `shadowBlur` berat | Interpolasi, kanvas HiDPI, api mesin, animasi ledakan, jeda otomatis + hitung mundur |
| Berbagi | Teks WhatsApp | **Kartu skor 1080×1920** untuk Story + **link tantangan** |
| Analytics | Tidak ada | Hook Cloudflare Web Analytics / GoatCounter (tinggal isi token) |

---

## 2. Rincian Perubahan

### 🔴 Perbaikan kerusakan

1. **Form kontak** ([js/script.js](../js/script.js) bagian 8, [index.html](../index.html) `#kontak`)
   - Tombol **Kirim via WhatsApp** membuka `wa.me/6281354997148` dengan pesan terisi (nama, email, isi).
   - Tombol **Kirim via Email** membuka aplikasi email ke `emilrahmat866@gmail.com`; bila `formspreeCode` di [js/config.js](../js/config.js) diisi, email terkirim langsung tanpa membuka aplikasi.
   - Validasi nama/pesan wajib dan format email; tidak ada lagi status "terkirim" palsu.
2. **NOVA** ([js/ai-chat.js](../js/ai-chat.js))
   - Endpoint dibaca dari `novaEndpoints` (bisa lebih dari satu, dicoba berurutan).
   - Timeout 6 detik dengan `AbortController`; bila semua gagal → jawaban dari basis pengetahuan lokal (proyek, keahlian, kontak, game) dan server tidak dicoba lagi selama 2 menit agar balasan berikutnya instan.
   - Label status berubah "online" ↔ "mode lokal".
   - Worker ([worker/src/index.js](../worker/src/index.js)): pengetahuan diperbarui (keahlian baru, kontak, proyek baru, disclaimer trading) + **rate limit 12 pesan/menit per IP**.
3. **Ikon rusak** di kartu GitHub dan dua komentar kode diperbaiki.
4. **Papan peringkat** ([js/firebase.js](../js/firebase.js), [firestore.rules](../firestore.rules))
   - Setiap browser login **anonim**; dokumen skor menyimpan `uid` pemilik → nama tidak bisa diambil alih orang lain.
   - Saat mulai main, waktu mulai dicatat dengan **jam server** (`sessions/{uid}`); rules menolak skor > ±250 poin/detik.
   - Validasi bentuk data: nama 1–14 karakter dan sama dengan ID dokumen, skor bilangan bulat, lencana hanya dari daftar resmi, skor tidak boleh turun, hapus dilarang.
   - Nama lama tanpa pemilik (mis. "EMIL", "Amboyy") bisa diklaim dengan **memecahkan skornya**.
   - Game memberi peringatan bila nama sudah dipakai pilot lain.

### 🟠 Performa

- `nova-avatar.png` 1,2 MB → `nova-avatar.webp` **5 KB**; `profil.jpeg` 71 KB → `profil.webp` 11 KB.
- Font: Space Grotesk dihapus, judul memakai Poppins.
- `script.js` (1.861 baris) dipecah: kode game pindah ke [js/game.js](../js/game.js) dan **dimuat saat bagian game mendekati layar**, disusul Firebase. Pemuatan awal tidak lagi membawa game + SDK Firestore.
- Handler scroll dibatasi sekali per frame (`requestAnimationFrame`, `passive`).
- Starfield latar **dijeda saat game berjalan** dan menghormati pengaturan "kurangi animasi".

### 🟡 Konten (siap untuk media sosial)

- **9 kartu proyek**: JasaHub, QiblaHub (+ versi web), Eco-Stock, Amboyy-AI, AI-SMC Trading, Gorden POS, Kamus Konjo, Reservasi Bioskop Terdistribusi, Portofolio Semesta.
- Screenshot asli (WebP ±10 KB): JasaHub & Web-QiblaHub (diambil dari situs live), QiblaHub & Eco-Stock (dari repo masing-masing).
- **Filter** Semua / Web / Mobile / AI dan **dialog Detail** berisi Masalah → Solusi → Fitur kunci.
- Repo privat diberi label **🔒 Kode privat** (tidak lagi menautkan ke profil GitHub umum yang membingungkan). Trading diberi disclaimer "bukan saran finansial".
- Keahlian: bar persentase diganti stack teknologi + bukti pemakaian di proyek.
- Sosial: Instagram → **@amboyybuild**, ditambah WhatsApp & Email; ikon placeholder (LinkedIn, TikTok, YouTube, dll.) yang tersembunyi dihapus.

### 🕹️ Game Astro Dodge lebih halus

| Perubahan | Efek |
|---|---|
| **Interpolasi render** (posisi digambar di antara dua langkah logika) | Gerakan mulus di layar 90/120/144 Hz, tidak patah-patah |
| **Kanvas HiDPI** (resolusi × devicePixelRatio, maks 2) + sprite emoji dirender ulang sesuai DPR | Roket, meteor, teks tajam di HP |
| `shadowBlur` pada laser & petir diganti goresan ganda | Beban GPU/CPU lebih ringan |
| **Api mesin** bercahaya (warna ikut mode/boost) | Roket terasa hidup |
| **Animasi ledakan 0,7 detik** sebelum panel hasil | Transisi game over tidak lagi tiba-tiba |
| **Jeda otomatis** saat pindah tab/layar mati + **hitung mundur 3·2·1** saat lanjut | Tidak mati mendadak setelah kembali |
| Pointer Events (sentuh, pena, mouse) + ketuk untuk berpindah | Kontrol HP lebih responsif |
| Reset tombol saat jendela kehilangan fokus, cegah klik "Mulai" ganda | Tidak ada tombol "nyangkut" |
| Starfield halaman dijeda selama bermain | Frame game lebih stabil |

### 🟢 Fitur baru untuk konten

- **Bagikan Skor 📸** → kartu PNG 1080×1920 (ukuran Story) berisi skor, peringkat, durasi, lencana, roket pilihan, URL, dan @amboyybuild. Di HP langsung membuka menu share; di laptop terunduh.
- **Salin Link Tantangan 🔗** → `…/Web_Amboyy/?challenge=SKOR&from=NAMA#game`. Pengunjung yang membuka link melihat banner tantangan, target di HUD, notifikasi saat terlampaui, dan hasil menang/kalah.
- **Analytics opsional** tanpa cookie (Cloudflare Web Analytics / GoatCounter) via [js/config.js](../js/config.js).

---

## 3. Pengujian

Diuji dengan Chromium headless (Playwright) pada server lokal, viewport desktop 1366×800 serta emulasi Pixel 7 & iPhone 13:

| Uji | Hasil |
|---|---|
| Halaman dimuat tanpa error JavaScript; tidak ada scroll horizontal | ✅ desktop & HP |
| Ukuran file sendiri saat pemuatan awal | ✅ ±160 KB (sebelumnya ±1,36 MB) |
| Filter proyek (AI → 4 kartu) & buka/tutup dialog detail | ✅ |
| Form kosong → pesan validasi; form terisi → WhatsApp terbuka dengan teks benar | ✅ |
| NOVA saat `workers.dev` diblokir → jawaban lokal, label "mode lokal" | ✅ |
| `game.js` & Firebase baru dimuat saat mendekati bagian game | ✅ |
| Kanvas game HiDPI di HP (1280×840 piksel untuk 357 px CSS) | ✅ |
| Frame time saat bermain (emulasi HP) | ✅ median 16,7 ms, p95 16,7 ms |
| Main sampai game over → animasi ledakan → panel hasil | ✅ |
| Kartu skor PNG 1080×1920 terunduh & link tantangan tersalin | ✅ |
| Link `?challenge=150&from=EMIL` → banner, target HUD, hasil tantangan | ✅ |
| Jeda via tombol "?" dan saat tab tersembunyi → skor berhenti; lanjut dengan hitung mundur | ✅ |
| Login anonim tanpa konfigurasi Firebase → game tetap jalan (fallback) | ✅ |

> `firestore.rules` belum bisa diuji dengan emulator (Java tidak terpasang). Uji di **Rules Playground** Firebase Console sebelum/sesudah deploy.

---

## 4. ⚠️ Yang Perlu Kamu Lakukan

1. **Hapus data uji** di Firestore: dokumen `leaderboard/testerbot` (skor 48) tercipta saat pengujian. Rules lama membolehkan penulisan tanpa login, tetapi tidak mengizinkan penghapusan.
2. **Aktifkan Anonymous Auth**: Firebase Console → Authentication → Sign-in method → Anonymous → *Enable*. (Saat ini muncul `auth/configuration-not-found`.)
3. **Deploy rules** dari root repo:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```

4. **Deploy ulang Worker NOVA** agar pengetahuan & rate limit baru aktif: `cd worker && npx wrangler deploy`.
5. **Domain sendiri untuk NOVA** (disarankan, mis. `amboyy.my.id`): pasang *Custom Domain* di Worker lalu taruh di urutan pertama `novaEndpoints` di [js/config.js](../js/config.js). Langkah lengkap ada di [worker/README.md](../worker/README.md).
6. **Opsional**: isi `formspreeCode` (form email terkirim langsung) dan token analytics di [js/config.js](../js/config.js).
7. **Gabungkan & push** branch ini ke `main` agar GitHub Pages memperbarui situs live.

Nomor WhatsApp dan email kini tampil publik di website sesuai data yang kamu berikan.

---

## 5. Berkas yang Berubah

| Berkas | Perubahan |
|---|---|
| `index.html` | Sosial, keahlian, proyek, kontak, elemen game baru, font, pemuatan skrip |
| `css/style.css` | Gaya kartu proyek, filter, dialog, keahlian, kontak, overlay game |
| `js/config.js` | **Baru** — konfigurasi kontak, NOVA, analytics |
| `js/script.js` | Starfield hemat daya, scroll ter-throttle, form kontak, filter/detail proyek, lazy-load game, analytics |
| `js/game.js` | **Baru** (dipisah dari script.js) + semua peningkatan game & fitur berbagi |
| `js/firebase.js` | Anonymous Auth, kepemilikan nama, sesi berbasis jam server |
| `js/ai-chat.js` | Multi-endpoint, timeout, jawaban lokal |
| `firestore.rules`, `firebase.json`, `.firebaserc` | **Baru** — Security Rules & konfigurasi deploy |
| `worker/src/index.js`, `worker/README.md` | Pengetahuan NOVA, rate limit, panduan custom domain |
| `img/*.webp`, `img/projects/*.webp` | Aset WebP baru; PNG/JPEG lama dihapus |
| `README.md` | Fitur, struktur, setup papan peringkat & analytics |

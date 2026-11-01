# Backend NOVA (Cloudflare Worker)

Worker ini menyimpan API key di server. Ia memakai Groq terlebih dahulu dan otomatis mencoba OpenRouter saat Groq bermasalah atau limit habis. NOVA juga mengambil metadata GitHub publik `Emil-02` dengan cache enam jam; README hanya diambil saat pengunjung menanyakan repository yang relevan.

1. Dari folder ini, jalankan `npx wrangler login`.
2. Jalankan `npx wrangler secret put GROQ_API_KEY`, lalu masukkan key Groq Anda.
3. Opsional: jalankan `npx wrangler secret put OPENROUTER_API_KEY` untuk fallback OpenRouter.
4. Opsional tetapi disarankan untuk kuota GitHub lebih tinggi: jalankan `npx wrangler secret put GITHUB_TOKEN` dan masukkan fine-grained personal access token GitHub read-only untuk repositori publik.
5. Jalankan `npx wrangler deploy`.
6. Masukkan URL Worker ke `novaEndpoints` di `../js/config.js`.

## Domain `*.workers.dev` diblokir sebagian ISP

Beberapa ISP di Indonesia (mis. XL/Axiata) mengalihkan `*.workers.dev` ke halaman blokir, sehingga NOVA tidak bisa dihubungi. Solusinya:

1. Hubungkan domain sendiri ke Cloudflare (mis. `amboyy.my.id`).
2. Di dashboard Worker → **Settings → Domains & Routes → Add Custom Domain** (mis. `nova.amboyy.my.id`).
3. Taruh URL custom domain itu di urutan **pertama** `novaEndpoints` pada `../js/config.js`.

Selama server AI tidak terjangkau, NOVA otomatis menjawab dari basis pengetahuan lokal di `../js/ai-chat.js`.

## Pembatas spam

Worker menolak lebih dari 12 pesan/menit per IP (HTTP 429) agar kuota Groq/OpenRouter tidak terkuras. Untuk batas yang konsisten di semua lokasi, aktifkan juga **Rate Limiting Rules** di dashboard Cloudflare.

Jangan masukkan API key ke Git, HTML, atau JavaScript browser. Sesuaikan `ALLOWED_ORIGINS` jika domain situs berubah.

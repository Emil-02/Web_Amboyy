# Backend NOVA (Cloudflare Worker)

Worker ini menyimpan API key di server. Ia memakai Groq terlebih dahulu dan otomatis mencoba OpenRouter saat Groq bermasalah atau limit habis. NOVA juga mengambil metadata GitHub publik `Emil-02` dengan cache enam jam; README hanya diambil saat pengunjung menanyakan repository yang relevan.

1. Dari folder ini, jalankan `npx wrangler login`.
2. Jalankan `npx wrangler secret put GROQ_API_KEY`, lalu masukkan key Groq Anda.
3. Opsional: jalankan `npx wrangler secret put OPENROUTER_API_KEY` untuk fallback OpenRouter.
4. Opsional tetapi disarankan untuk kuota GitHub lebih tinggi: jalankan `npx wrangler secret put GITHUB_TOKEN` dan masukkan fine-grained personal access token GitHub read-only untuk repositori publik.
5. Jalankan `npx wrangler deploy`.
5. Salin URL Worker ke konstanta `API_URL` di `../js/ai-chat.js`.

Jangan masukkan API key ke Git, HTML, atau JavaScript browser. Sesuaikan `ALLOWED_ORIGINS` jika domain situs berubah.

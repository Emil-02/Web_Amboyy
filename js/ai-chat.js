/* NOVA — API key tidak pernah berada di browser.
   Bila server AI tak terjangkau (mis. *.workers.dev diblokir ISP), NOVA
   menjawab dari basis pengetahuan lokal agar pengunjung tetap terbantu. */
(() => {
  const cfg = window.SITE_CONFIG || {};
  const ENDPOINTS = (cfg.novaEndpoints || []).filter(Boolean);
  const TIMEOUT = cfg.novaTimeoutMs || 9000;
  const contact = cfg.contact || {};

  const panel = document.getElementById("ai-panel");
  const launcher = document.getElementById("ai-launcher");
  const close = document.getElementById("ai-close");
  const form = document.getElementById("ai-form");
  const input = document.getElementById("ai-input");
  const messages = document.getElementById("ai-messages");
  const suggestions = document.getElementById("ai-suggestions");
  const statusEl = panel.querySelector(".ai-online");
  const history = [];
  let workingEndpoint = null; // endpoint terakhir yang berhasil dipakai lagi
  let remoteDownUntil = 0; // server tak terjangkau → langsung mode lokal sementara
  let busy = false;

  // ---- Basis pengetahuan lokal (cadangan) ----
  const LOCAL = [
    {
      k: /jasahub|marketplace|escrow/,
      a: "JasaHub adalah marketplace jasa mahasiswa yang sudah live di jasahub.me — ada escrow, chat real-time, verifikasi KTM, dan mediasi sengketa. Dibangun dengan Next.js, Supabase, dan Vercel.",
    },
    {
      k: /qibla|kiblat|salat|sholat|adzan|masjid/,
      a: "QiblaHub adalah aplikasi Islami: kompas kiblat real-time, jadwal salat + adzan, kalender Hijriah, dan masjid terdekat. Ada versi Android (Flutter) dan versi web di emil-02.github.io/Web-QiblaHub.",
    },
    {
      k: /eco.?stock|umkm|stok|lstm|cuaca/,
      a: "Eco-Stock adalah inventori pintar UMKM (proyek PKM) yang menyesuaikan stok dengan cuaca dan memprediksi penjualan memakai LSTM. Dibangun dengan Flutter dan Firebase.",
    },
    {
      k: /trading|smc|saham|forex|mt5|metatrader/,
      a: "AI-SMC Trading System menganalisis Smart Money Concepts untuk MetaTrader 5 dan mengirim sinyal ke Telegram (Python + Gemini AI). Ini proyek riset & edukasi, bukan saran finansial.",
    },
    {
      k: /amboyy.?ai|asisten|wake ?word|hai amboyy/,
      a: "Amboyy-AI adalah asisten AI berbahasa Indonesia dengan wake word \"Hai Amboyy\", text-to-speech, dan berita market — versi Flutter dan React.",
    },
    {
      k: /gorden|\bpos\b|kasir/,
      a: "Gorden POS adalah aplikasi kasir untuk usaha gorden sungguhan: transaksi, struk, piutang pelanggan, dan grafik penjualan (TypeScript, Capacitor, Firebase).",
    },
    {
      k: /game|astro|dodge|skor|leaderboard|peringkat/,
      a: "Astro Dodge adalah mini game di website ini! Hindari meteor & bug, ambil power-up, lalu bagikan kartu skormu untuk menantang teman. Scroll ke bagian Zona Bermain 🚀",
    },
    {
      k: /proyek|project|karya|portofolio|terbaru/,
      a: "Proyek unggulan Amboyy: JasaHub (live), QiblaHub, Eco-Stock, Amboyy-AI, AI-SMC Trading, dan Gorden POS. Lihat bagian Proyek lalu klik Detail untuk cerita tiap proyek.",
    },
    {
      k: /keahlian|skill|bisa apa|teknologi|stack|bahasa pemrograman/,
      a: "Amboyy membangun aplikasi mobile (Flutter), web (Next.js, React, TypeScript), backend (Supabase, Firebase, Flask), dan eksperimen AI dengan Python.",
    },
    {
      k: /kontak|hubungi|email|\bwa\b|whatsapp|instagram|\big\b|kolaborasi|kerja ?sama|hire|freelance/,
      a: `Hubungi Amboyy lewat WhatsApp wa.me/${contact.whatsapp || "6281354997148"}, email ${contact.email || "emilrahmat866@gmail.com"}, atau Instagram @${contact.instagram || "amboyybuild"}. Bisa juga lewat form di bagian Kontak.`,
    },
    {
      k: /siapa|amboyy|emil|kamu|tentang|kuliah|kampus/,
      a: "Amboyy (Emil-02) adalah mahasiswa Informatika Universitas Muhammadiyah Makassar yang membangun aplikasi mobile & web serta mengeksplorasi AI. Motonya: \"Debug your past, compile your future.\"",
    },
  ];
  function localAnswer(text) {
    const q = text.toLowerCase();
    const hit = LOCAL.find((item) => item.k.test(q));
    return hit
      ? hit.a
      : "Aku sedang dalam mode hemat sinyal 🛰️ Coba tanyakan tentang proyek, keahlian, game, atau cara menghubungi Amboyy.";
  }

  function setOpen(open) {
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  }
  function addMessage(text, role, extra = "") {
    const item = document.createElement("article");
    item.className = `ai-message ai-${role} ${extra}`;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  async function ask(url, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.error || "request-failed");
      return data.reply;
    } finally {
      clearTimeout(timer);
    }
  }

  async function remoteAnswer() {
    if (Date.now() < remoteDownUntil) throw new Error("cooldown");
    const body = JSON.stringify({ messages: history.slice(-8) });
    const order = workingEndpoint
      ? [workingEndpoint, ...ENDPOINTS.filter((u) => u !== workingEndpoint)]
      : ENDPOINTS;
    for (const url of order) {
      try {
        const reply = await ask(url, body);
        workingEndpoint = url;
        return reply;
      } catch {
        /* coba endpoint berikutnya */
      }
    }
    remoteDownUntil = Date.now() + 2 * 60 * 1000; // coba lagi 2 menit kemudian
    throw new Error("unreachable");
  }

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;
    busy = true;
    addMessage(message, "user");
    history.push({ role: "user", content: message });
    input.value = "";
    const pending = addMessage("", "bot", "ai-typing");
    const label = document.createElement("span");
    label.textContent = "NOVA sedang berpikir";
    const dots = document.createElement("span");
    dots.className = "ai-thinking-dots";
    for (let i = 0; i < 3; i++) dots.appendChild(document.createElement("i"));
    pending.append(label, dots);

    let reply;
    let offline = false;
    const minDelay = new Promise((r) => setTimeout(r, 700 + Math.random() * 400));
    try {
      if (!ENDPOINTS.length) throw new Error("not-configured");
      [reply] = await Promise.all([remoteAnswer(), minDelay]);
    } catch {
      await minDelay;
      reply = localAnswer(message);
      offline = true;
    }
    pending.remove();
    if (statusEl) statusEl.textContent = offline ? "mode lokal" : "online";
    addMessage(reply, "bot", offline ? "ai-offline" : "");
    history.push({ role: "assistant", content: reply });
    busy = false;
  }

  launcher.addEventListener("click", () =>
    setOpen(!panel.classList.contains("open")),
  );
  close.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) setOpen(false);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    send(input.value);
  });
  suggestions.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) send(button.textContent);
  });
})();

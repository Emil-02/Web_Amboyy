/* ============================================================
   Astro Dodge — mini game (dimuat saat bagian #game mendekati layar)
   ============================================================ */

(function () {
  const cv = document.getElementById("game-canvas");
  if (!cv) return;

  const g = cv.getContext("2d");
  // Ukuran logika tetap 640×420; resolusi piksel asli mengikuti layar (HiDPI)
  const W = 640;
  const H = 420;
  let DPR = 1;

  const overlay = document.getElementById("game-overlay");
  const overlayTitle = document.getElementById("game-overlay-title");
  const overlayText = document.getElementById("game-overlay-text");
  const startBtn = document.getElementById("game-start");
  const scoreEl = document.getElementById("game-score");
  const bestEl = document.getElementById("game-best");
  const playerEl = document.getElementById("game-player");
  const nameInput = document.getElementById("game-name");
  const goResult = document.getElementById("go-result");
  const goScore = document.getElementById("go-score");
  const goRank = document.getElementById("go-rank");
  const goTime = document.getElementById("go-time");
  const goPower = document.getElementById("go-power");
  const goBadges = document.getElementById("go-badges");
  const nameHint = document.getElementById("name-hint");
  const challengeEl = document.getElementById("challenge-banner");
  const SITE_URL =
    (window.SITE_CONFIG && window.SITE_CONFIG.siteUrl) ||
    "https://emil-02.github.io/Web_Amboyy/";

  // ⚔️ Link tantangan: ?challenge=2036&from=EMIL#game
  const challenge = (() => {
    const q = new URLSearchParams(location.search);
    const target = Math.floor(Number(q.get("challenge")));
    if (!Number.isFinite(target) || target < 1 || target > 1e6) return null;
    const from = (q.get("from") || "Seorang pilot")
      .replace(/[\u0000-\u001f<>]/g, "")
      .trim()
      .slice(0, 14);
    return { target, from: from || "Seorang pilot", beaten: false };
  })();
  if (challenge) {
    challengeEl.textContent = `⚔️ ${challenge.from} menantangmu mengalahkan ${challenge.target} poin!`;
    challengeEl.classList.remove("hidden");
  }

  // ---- Papan peringkat (localStorage) ----
  let board = [];
  try {
    board = JSON.parse(localStorage.getItem("astroDodgeBoard")) || [];
  } catch {
    board = [];
  }
  let playerName = localStorage.getItem("astroDodgeName") || "";
  nameInput.value = playerName;

  function getBest(name) {
    const entry = board.find(
      (e) => e.name.toLowerCase() === name.toLowerCase(),
    );
    return entry ? entry.score : 0;
  }

  // ---- 🎖️ Lencana pilot ----
  // Tier skor (urut dari tertinggi — hanya tier teratas yang dipajang)
  const scoreBadges = [
    { id: "legend", emoji: "👑", name: "Legend", min: 10000 },
    { id: "multiverse", emoji: "🌀", name: "Master Multiverse", min: 5000 },
    { id: "universe", emoji: "🌠", name: "Master Universe", min: 3000 },
    { id: "galaksi", emoji: "🌌", name: "Master Galaksi", min: 1000 },
  ];
  // Lencana spesial: hancurkan ≥7 rintangan sekaligus (🔥 Firebase Blast)
  const cleanerBadge = {
    id: "pembersih",
    emoji: "🧹",
    name: "Pembersih Langit",
  };
  // Lencana eksklusif pemilik nama rahasia (jangan didokumentasikan 😉)
  const voyagerBadge = {
    id: "voyager",
    emoji: "🛸",
    name: "Aurora Voyager",
  };
  // Lencana para rival terdaftar ⚔️
  const rivalBadge = {
    id: "rival",
    emoji: "⚔️",
    name: "Rival Terdaftar",
  };

  function earnBadges(entry, runScore, cleaner, vip, rival) {
    const owned = new Set(entry.badges || []);
    const newly = [];
    for (const b of scoreBadges) {
      if (runScore >= b.min && !owned.has(b.id)) {
        owned.add(b.id);
        newly.push(b);
      }
    }
    if (cleaner && !owned.has(cleanerBadge.id)) {
      owned.add(cleanerBadge.id);
      newly.push(cleanerBadge);
    }
    if (vip && !owned.has(voyagerBadge.id)) {
      owned.add(voyagerBadge.id);
      newly.push(voyagerBadge);
    }
    if (rival && !owned.has(rivalBadge.id)) {
      owned.add(rivalBadge.id);
      newly.push(rivalBadge);
    }
    entry.badges = [...owned];
    return newly;
  }

  function badgeIcons(entry) {
    const owned = new Set(entry.badges || []);
    const icons = [];
    if (owned.has(voyagerBadge.id)) icons.push(voyagerBadge); // paling depan
    if (owned.has(rivalBadge.id)) icons.push(rivalBadge);
    const top = scoreBadges.find((b) => owned.has(b.id)); // tier tertinggi
    if (top) icons.push(top);
    if (owned.has(cleanerBadge.id)) icons.push(cleanerBadge);
    return icons;
  }

  function renderBoard(highlightName) {
    const top3El = document.getElementById("lb-top3");
    const restEl = document.getElementById("lb-rest");
    const emptyEl = document.getElementById("lb-empty");
    top3El.innerHTML = "";
    restEl.innerHTML = "";
    emptyEl.style.display = board.length ? "none" : "block";
    document.getElementById("lb-divider").hidden = board.length <= 3;
    document.querySelector(".lb-subtitle").textContent = board.length
      ? `${board.length} pilot telah mengangkasa 🚀`
      : "Semua pilot yang pernah mengangkasa";

    const medals = ["🥇", "🥈", "🥉"];
    board.forEach((entry, i) => {
      const li = document.createElement("li");
      li.className = i < 3 ? `lb-item lb-rank-${i + 1}` : "lb-item";
      if (
        highlightName &&
        entry.name.toLowerCase() === highlightName.toLowerCase()
      ) {
        li.classList.add("me");
      }
      const rank = document.createElement("span");
      rank.className = "lb-rank";
      rank.textContent = i < 3 ? medals[i] : `${i + 1}`;
      const name = document.createElement("span");
      name.className = "lb-name";
      name.textContent = entry.name; // textContent = aman dari injeksi HTML
      // 💀 Label troll untuk para rival terdaftar
      if ((entry.badges || []).includes("rival")) {
        const owner = board.find((x) => x.name.toLowerCase() === "amboyy");
        const myScore = owner ? owner.score : 0;
        const troll = document.createElement("small");
        troll.className = "lb-troll";
        troll.textContent =
          entry.score > myScore
            ? "🏆 (Hoki Doang Ini Mah)"
            : "📉 Masih di bawah Amboyy — latihan lagi ya!";
        name.appendChild(troll);
      }
      const badges = document.createElement("span");
      badges.className = "lb-badges";
      const icons = badgeIcons(entry);
      badges.textContent = icons.map((b) => b.emoji).join("");
      badges.title = icons.map((b) => b.name).join(" · ");
      const score = document.createElement("span");
      score.className = "lb-score";
      score.textContent = entry.score;
      li.append(rank, name, badges, score);
      (i < 3 ? top3El : restEl).appendChild(li);
    });
  }

  function submitScore(name, newScore, cleaner, vip, rival) {
    const idx = board.findIndex(
      (e) => e.name.toLowerCase() === name.toLowerCase(),
    );
    let improved = false;
    let entry;
    if (idx >= 0) {
      entry = board[idx];
      if (newScore > entry.score) {
        entry.score = newScore;
        improved = true;
      }
    } else {
      entry = { name, score: newScore, badges: [] };
      board.push(entry);
      improved = true;
    }
    const newBadges = earnBadges(entry, newScore, cleaner, vip, rival); // 🎖️
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem("astroDodgeBoard", JSON.stringify(board));
    const rank =
      board.findIndex((e) => e.name.toLowerCase() === name.toLowerCase()) + 1;
    return { rank, improved, newBadges };
  }

  // 🌐 Papan global (Firebase): terima pembaruan live bila tersedia
  function applyGlobalBoard(list) {
    board = list;
    localStorage.setItem("astroDodgeBoard", JSON.stringify(board));
    renderBoard(playerName);
    renderSkins(); // lencana dari cloud bisa membuka skin
    updateNameHint();
    if (playerName) bestEl.textContent = getBest(playerName);
  }
  window.addEventListener("cosmic:board", (e) => applyGlobalBoard(e.detail));

  // Nama pilot unik di papan global — cegah orang memakai nama pilot lain
  function nameTakenByOther(name) {
    if (!window.cosmicDB || !window.cosmicDB.uid) return false;
    const entry = board.find(
      (e) => e.name.toLowerCase() === (name || "").toLowerCase(),
    );
    return Boolean(entry && entry.owned && !entry.mine);
  }
  function updateNameHint() {
    const taken = nameTakenByOther(nameInput.value.trim());
    nameHint.textContent = taken
      ? "⚠️ Nama ini sudah dipakai pilot lain — pilih nama lain."
      : "";
    return taken;
  }

  const ship = { x: W / 2, y: H - 46, r: 17, vx: 0, speed: 6 };

  // Rintangan: meteor + masalah sehari-hari developer
  const hazardTypes = [
    { emoji: "☄️", label: "", weight: 5, spin: true },
    { emoji: "🐞", label: "Bug", weight: 2, spin: false },
    { emoji: "🚫", label: "404 Error", weight: 1.5, spin: false },
    { emoji: "🖥️", label: "Server Down", weight: 1.5, spin: false },
    { emoji: "💾", label: "Memory Leak", weight: 1, spin: false },
  ];

  // Power-up dari tech stack
  const powerTypes = [
    { id: "star", emoji: "⭐", label: "+25", weight: 3.5 },
    { id: "js", emoji: "⚡", label: "JS Boost", weight: 2 },
    { id: "shield", emoji: "🛡️", label: "Shield", weight: 1.5 },
    { id: "python", emoji: "🐍", label: "Slow-Mo", weight: 1.5 },
    { id: "firebase", emoji: "🔥", label: "Blast", weight: 1 },
  ];

  function pickWeighted(list) {
    let r = Math.random() * list.reduce((s, t) => s + t.weight, 0);
    for (const t of list) {
      r -= t.weight;
      if (r <= 0) return t;
    }
    return list[0];
  }

  let rocks = [];
  let powerUps = [];
  let bgDots = [];
  let keys = {};
  let playing = false;
  let score = 0;
  let frame = 0;
  let shieldCount = 0; // 🛡️ menahan benturan
  let boostFrames = 0; // ⚡ JS speed boost
  let slowFrames = 0; // 🐍 Python slow-mo
  let flashFrames = 0; // kilat saat shield pecah / firebase blast
  let cleanerEarned = false; // 🧹 hancurkan ≥7 rintangan sekaligus
  let powerTaken = 0; // 🎁 jumlah power-up yang diambil dalam satu run
  let particles = []; // 💥 pecahan ledakan
  let boss = null; // 👾 Segmentation Fault
  let bossesSpawned = 0; // berapa boss sudah muncul (tiap 1000 poin)
  let combo = 0; // 🔥 near-miss beruntun
  let comboTimer = 0;
  let comboPops = []; // teks mengambang "NYARIS! +N"
  let lastRun = null; // hasil terakhir untuk kartu skor & link tantangan
  let shareImage = null; // Promise<Blob> kartu skor (dibuat saat game over)
  let pointerTarget = null; // posisi jari/kursor — kapal meluncur mulus ke sana
  let lastShownScore = -1; // hindari tulis DOM tiap frame
  let lastTime = 0; // fixed-timestep accumulator
  let acc = 0;
  let exhaust = []; // 🔥 jejak api mesin roket
  let shipDead = false; // roket hancur → animasi ledakan sebelum panel hasil
  let dying = false;
  let resumeCountdown = 0; // ms hitung mundur setelah jeda
  let pausedByVisibility = false;

  function announcePlaying(on) {
    window.dispatchEvent(new CustomEvent("astro:playing", { detail: on }));
  }

  // ---- 🔊 Suara retro (Web Audio API, tanpa file) ----
  let audioCtx = null;
  let muted = localStorage.getItem("astroMuted") === "1";

  function tone(f1, f2, dur, type, vol) {
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const gn = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
    gn.gain.setValueAtTime(vol, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(gn);
    gn.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noiseBurst(dur, vol) {
    const t = audioCtx.currentTime;
    const len = Math.floor(audioCtx.sampleRate * dur);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = audioCtx.createBufferSource();
    const gn = audioCtx.createGain();
    src.buffer = buf;
    gn.gain.setValueAtTime(vol, t);
    src.connect(gn);
    gn.connect(audioCtx.destination);
    src.start(t);
  }

  function sfx(kind, opt = 0) {
    if (muted) return;
    try {
      audioCtx =
        audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      switch (kind) {
        case "laser":
          tone(900, 160, 0.13, "square", 0.06);
          break;
        case "boom":
          noiseBurst(0.28, 0.16);
          tone(190, 45, 0.28, "sawtooth", 0.1);
          break;
        case "power":
          tone(520, 1040, 0.14, "sine", 0.09);
          setTimeout(() => !muted && tone(780, 1560, 0.12, "sine", 0.07), 70);
          break;
        case "hit":
          noiseBurst(0.15, 0.12);
          tone(300, 90, 0.2, "square", 0.08);
          break;
        case "over":
          tone(400, 60, 0.7, "sawtooth", 0.1);
          noiseBurst(0.5, 0.1);
          break;
        case "record":
          [523, 659, 784, 1047].forEach((f, i) =>
            setTimeout(
              () => !muted && tone(f, f, 0.16, "triangle", 0.09),
              i * 110,
            ),
          );
          break;
        case "combo":
          tone(600 + opt * 90, 900 + opt * 120, 0.09, "triangle", 0.07);
          break;
        case "boss":
          [220, 175, 220, 175].forEach((f, i) =>
            setTimeout(
              () => !muted && tone(f, f, 0.18, "square", 0.09),
              i * 160,
            ),
          );
          break;
      }
    } catch {
      /* audio tak tersedia — abaikan */
    }
  }

  // 💥 Pecahan partikel
  function spawnParticles(x, y, color, n = 12, speed = 3.2) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * speed + 0.8;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 26 + Math.random() * 16,
        max: 42,
        color,
        r: Math.random() * 2.4 + 1,
      });
    }
  }

  // 🚀 Skin roket — terbuka lewat lencana pilot
  const skins = [
    { emoji: "🚀", need: null, label: "Roket Klasik" },
    { emoji: "🛸", need: "galaksi", label: "UFO — butuh 🌌 Master Galaksi" },
    {
      emoji: "👾",
      need: "universe",
      label: "Invader — butuh 🌠 Master Universe",
    },
    {
      emoji: "🐉",
      need: "multiverse",
      label: "Naga Kosmik — butuh 🌀 Master Multiverse",
    },
    { emoji: "🦄", need: "legend", label: "Unicorn — butuh 👑 Legend" },
    {
      emoji: "🧹",
      need: "pembersih",
      label: "Sapu Terbang — butuh 🧹 Pembersih Langit",
    },
  ];
  let shipSkin = localStorage.getItem("astroSkin") || "🚀";

  function unlockedBadges(name) {
    const entry = board.find(
      (e) => e.name.toLowerCase() === (name || "").toLowerCase(),
    );
    return new Set(entry ? entry.badges || [] : []);
  }

  function renderSkins() {
    const holder = document.getElementById("skin-picker");
    if (!holder) return;
    const owned = unlockedBadges(nameInput.value.trim() || playerName);
    holder.innerHTML = "";
    skins.forEach((s) => {
      const open = !s.need || owned.has(s.need);
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "skin-btn" +
        (shipSkin === s.emoji ? " selected" : "") +
        (open ? "" : " locked");
      b.textContent = open ? s.emoji : "🔒";
      b.title = s.label;
      b.addEventListener("click", () => {
        if (!open) return;
        shipSkin = s.emoji;
        localStorage.setItem("astroSkin", shipSkin);
        renderSkins();
      });
      holder.appendChild(b);
    });
  }

  // ---- 🌟 VIP Mode (easter egg rahasia) ----
  const frameEl = document.querySelector(".game-frame");
  // Checksum kalibrasi profil penerbangan — bukan data yang bisa dibaca 😉
  const calibrationProfiles = [
    "2b2a6c5ea9bdba5e04bb9d10b9081902f1706b135a5bc82fd872d73e88f3412e",
    "f3de2208d7274478367eff113adb6c4ebad682691746d9ff4f7d1e69f7e20999",
    "b783323813ae5f5efcfeba091b9046bad5278a008465955cea63652abe390b05",
  ];
  // Checksum protokol rival — juga bukan data yang bisa dibaca 💀
  const rivalProfiles = [
    "bf2ed13dbe20eef8093e3a4c5a7ed976a09e818c656a2bf0c151d36929a57bbe",
    "e607063d4de5f80b25d5af751f9d547d0b43edd28142c59394b7f1731f823d47",
    "cd644e9865db5e5eb716137aa884cbf1be9b95b6ac911fc4007d5920971c71ce",
    "a68af7d02737e2860c9e6640387dc1f93a7f5d19e6df04fe04fb3ebe37c9b45e",
    "2668bffa8e131b128700fc45fbdaf2a558920022a2f42bca61cf697c3dade242",
    "e2f169211f83b61b6d66a8a3459dea55d1ec44abe6731885942f1f3704e003c2",
    "790479d9b7951cd447d3da79d6d9b8c5bc525efb51cba12cd3a4834cede5b6e7",
    "61ce083404959ce1e844f44ba74655324bdcd710be1bb08c940061f6912aa0e0",
    "d3335ec0ebf05a25883e874a38bd4e10700b9d320b80b186bd10244f86b04c8f",
  ];
  async function flightSignature(name) {
    if (!window.crypto || !crypto.subtle) return "";
    const data = new TextEncoder().encode(`${name.toLowerCase()}::amboyy-vip`);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let vipMode = false;
  let chaosMode = false; // 💀 Protokol Rival

  // Rintangan absurd Chaos Mode — mimpi buruk mahasiswa & gamer
  const chaosHazardTypes = [
    { emoji: "📶", label: "RTO", weight: 2.5, spin: false },
    { emoji: "📄", label: "Revisi", weight: 2, spin: false },
    { emoji: "⏰", label: "Deadline Besok", weight: 2, spin: false },
    { emoji: "📚", label: "Tugas Kuliah", weight: 1.5, spin: false },
    { emoji: "🩴", label: "Sandal Jepit", weight: 1.5, spin: true },
    { emoji: "☕", label: "Kopi Tumpah", weight: 1.5, spin: true },
  ];

  // Roasting saat rival kalah 🤣
  const chaosRoasts = [
    "Yahh, skill segini doang? Mending istirahat dulu bro, jangan dipaksain! ☕",
    "Terdeteksi: waktu respons pilot {NAME} terlalu lambat. Butuh kopi tambahan?",
    "Koneksi aman, keyboard normal... fix ini murni masalah di skill pilotnya. 🤣",
    "Meteornya pelan kok... pilotnya aja yang panik duluan. 💀",
  ];
  let holoFrames = 0; // durasi hologram pembuka
  let vipMsg = ["", ""]; // pesan witty terpilih (acak tiap main)
  let drone = null; // 🛰️ wingman drone pengawal
  let droneCooldown = 0; // jeda antar tembakan laser
  let lasers = []; // efek tembakan laser singkat
  let toastQueue = []; // antrean notifikasi eksklusif
  let activeToast = null;
  let transmissionShown = false;
  let transmissionFrames = 0; // kotak radio Mission Control
  let divertFrames = 0; // sistem "mengalihkan meteor" dari jalur pilot

  const vipMessages = [
    ["TARGET ACQUIRED: {NAME}", "Kamu pilot paling cepat sejauh ini! 🚀"],
    [
      "⚠ PERINGATAN SISTEM",
      "Kehadiran pilot {NAME} menyebabkan anomali. Luar biasa! ⚡",
    ],
  ];

  // Di VIP Mode, meteor berubah jadi bintang keberuntungan & komet neon
  const vipHazardTypes = [
    { emoji: "🌟", label: "", weight: 4, spin: false, trail: "gold" },
    { emoji: "☄️", label: "", weight: 3, spin: true, trail: "neon" },
    { emoji: "✨", label: "", weight: 2, spin: false, trail: "gold" },
  ];

  // Titik bintang latar dalam kanvas (efek melaju di angkasa)
  function makeBgDots() {
    const palette = vipMode
      ? ["#a7f3d0", "#c4b5fd", "#99f6e4", "#ffffff"]
      : ["#ffffff"];
    bgDots = Array.from({ length: 46 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.4,
      vy: Math.random() * 1.2 + 0.4,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));
  }

  // 🎯 Sprite cache: emoji digambar SEKALI ke kanvas kecil lalu di-drawImage
  // (fillText tiap objek tiap frame jauh lebih berat — ini kunci kehalusan)
  // Sprite dirender pada resolusi piksel layar (DPR) agar tajam di HP.
  const spriteCache = new Map();
  function emojiSprite(emoji, size) {
    const key = emoji + "@" + size;
    let c = spriteCache.get(key);
    if (!c) {
      const pad = Math.ceil(size * 0.35);
      const box = size + pad * 2;
      c = document.createElement("canvas");
      c.width = c.height = Math.ceil(box * DPR);
      c.box = box; // ukuran logika
      const cg = c.getContext("2d");
      cg.scale(DPR, DPR);
      cg.font = `${size}px serif`;
      cg.textAlign = "center";
      cg.textBaseline = "middle";
      cg.fillText(emoji, box / 2, box / 2);
      spriteCache.set(key, c);
    }
    return c;
  }

  function drawEmoji(emoji, x, y, size, angle = 0) {
    // bulatkan ukuran ke kelipatan 2 agar cache tidak membengkak
    const s = emojiSprite(emoji, Math.max(8, Math.round(size / 2) * 2));
    const b = s.box;
    if (angle) {
      g.save();
      g.translate(x, y);
      g.rotate(angle);
      g.drawImage(s, -b / 2, -b / 2, b, b);
      g.restore();
    } else {
      g.drawImage(s, x - b / 2, y - b / 2, b, b);
    }
  }

  // ✨ Glow cache: lingkaran cahaya dirender sekali, dipakai berulang
  function drawGlow(rgb, alpha, radius, x, y) {
    const key = `glow:${rgb}:${alpha}:${radius}`;
    let c = spriteCache.get(key);
    if (!c) {
      c = document.createElement("canvas");
      c.width = c.height = Math.ceil(radius * 2 * DPR);
      const cg = c.getContext("2d");
      cg.scale(DPR, DPR);
      const rg = cg.createRadialGradient(
        radius,
        radius,
        radius * 0.05,
        radius,
        radius,
        radius,
      );
      rg.addColorStop(0, `rgba(${rgb}, ${alpha})`);
      rg.addColorStop(1, `rgba(${rgb}, 0)`);
      cg.fillStyle = rg;
      cg.fillRect(0, 0, radius * 2, radius * 2);
      spriteCache.set(key, c);
    }
    g.drawImage(c, x - radius, y - radius, radius * 2, radius * 2);
  }

  // 🌌 Latar VIP pra-render (gradien statis tak perlu dihitung tiap frame)
  let vipBg = null;
  function vipBgCache() {
    if (!vipBg) {
      vipBg = document.createElement("canvas");
      vipBg.width = Math.ceil(W * DPR);
      vipBg.height = Math.ceil(H * DPR);
      const c = vipBg.getContext("2d");
      c.scale(DPR, DPR);
      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#04121f");
      grad.addColorStop(0.55, "#0a1b2e");
      grad.addColorStop(1, "#060d1f");
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);
    }
    return vipBg;
  }

  // Backing store kanvas = ukuran logika × DPR (maks 2 — hemat baterai HP)
  function fitCanvas() {
    const next = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    if (next === DPR && cv.width === Math.round(W * DPR)) return;
    DPR = next;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    spriteCache.clear();
    vipBg = null;
    if (!playing) draw();
  }

  function reset() {
    rocks = [];
    powerUps = [];
    score = 0;
    frame = 0;
    shieldCount = 0;
    boostFrames = 0;
    slowFrames = 0;
    flashFrames = 0;
    cleanerEarned = false;
    powerTaken = 0;
    particles = [];
    boss = null;
    bossesSpawned = 0;
    combo = 0;
    comboTimer = 0;
    comboPops = [];
    lasers = [];
    toastQueue = [];
    activeToast = null;
    transmissionShown = false;
    transmissionFrames = 0;
    divertFrames = 0;
    pointerTarget = null;
    lastShownScore = -1;
    exhaust = [];
    shipDead = false;
    resumeCountdown = 0;
    if (challenge) challenge.beaten = false;
    ship.x = W / 2;
    ship.px = ship.x;
    ship.vx = 0;
    scoreEl.textContent = "0";
    makeBgDots();
  }

  function difficulty() {
    return 1 + Math.min(score / 400, 2.2); // makin tinggi skor, makin cepat
  }

  function applyPower(type) {
    powerTaken++;
    sfx("power");
    switch (type.id) {
      case "star":
        score += 25;
        break;
      case "js": // ⚡ roket makin gesit 6 detik
        boostFrames = 6 * 60;
        break;
      case "shield": // 🛡️ tahan benturan (maks 2 lapis)
        shieldCount = Math.min(shieldCount + 1, 2);
        break;
      case "python": // 🐍 perlambat waktu 5 detik
        slowFrames = 5 * 60;
        break;
      case "firebase": // 🔥 ledakkan semua rintangan (+5/rintangan)
        if (rocks.length >= 7) cleanerEarned = true; // 🧹 Pembersih Langit
        score += rocks.length * 5;
        rocks.forEach((o) =>
          spawnParticles(o.x, o.y, "rgba(255, 170, 60, 0.9)", 8, 2.6),
        );
        if (boss) boss.hp -= 3; // 🔥 blast melukai boss juga
        rocks = [];
        flashFrames = 14;
        sfx("boom");
        break;
    }
  }

  // Simpan posisi sebelumnya → draw() menginterpolasi di antara dua langkah
  // logika. Hasilnya gerakan mulus di layar 90/120/144 Hz, bukan patah-patah.
  function snapshot() {
    ship.px = ship.x;
    for (const o of rocks) {
      o.px = o.x;
      o.py = o.y;
      o.pa = o.angle;
    }
    for (const o of powerUps) o.py = o.y;
    for (const d of bgDots) d.py = d.y;
    for (const p of particles) {
      p.px = p.x;
      p.py = p.y;
    }
    for (const e of exhaust) e.py = e.y;
    if (boss) {
      boss.px = boss.x;
      boss.py = boss.y;
    }
    if (drone) {
      drone.px = drone.x;
      drone.py = drone.y;
    }
  }

  // Efek yang tetap bergerak saat animasi ledakan (game sudah berakhir)
  function updateFx() {
    for (const d of bgDots) {
      d.y += d.vy;
      if (d.y > H) {
        d.y = -2;
        d.py = d.y; // jangan interpolasi lompatan dari bawah ke atas
        d.x = Math.random() * W;
      }
    }
    lasers.forEach((l) => l.life--);
    lasers = lasers.filter((l) => l.life > 0);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
    });
    particles = particles.filter((p) => p.life > 0);
    comboPops.forEach((c) => {
      c.y -= 0.7;
      c.life--;
    });
    comboPops = comboPops.filter((c) => c.life > 0);
    exhaust.forEach((e) => {
      e.y += e.vy;
      e.life--;
    });
    exhaust = exhaust.filter((e) => e.life > 0);
  }

  function update() {
    snapshot();
    frame++;
    if (boostFrames > 0) boostFrames--;
    if (slowFrames > 0) slowFrames--;
    if (flashFrames > 0) flashFrames--;
    if (holoFrames > 0) holoFrames--;
    if (transmissionFrames > 0) transmissionFrames--;
    if (divertFrames > 0) divertFrames--;

    // 🔔 Notifikasi eksklusif muncul berurutan
    if (!activeToast && toastQueue.length && frame >= toastQueue[0].at) {
      activeToast = { text: toastQueue.shift().text, life: 170 };
    }
    if (activeToast && --activeToast.life <= 0) activeToast = null;

    // 📻 Transmisi Mission Control di detik ke-12 (VIP)
    if (vipMode && !transmissionShown && frame === 720) {
      transmissionShown = true;
      transmissionFrames = 460;
      divertFrames = 360; // sistem sungguhan mengalihkan meteor dari jalurnya
    }

    // Gerak kapal — akselerasi & pengereman halus (⚡ JS Boost = lebih gesit)
    const speed = boostFrames > 0 ? 9 : ship.speed;
    const left = keys.ArrowLeft || keys.a || keys.A;
    const right = keys.ArrowRight || keys.d || keys.D;
    if (left || right) pointerTarget = null; // keyboard mengambil alih
    if (pointerTarget !== null) {
      // sentuh/mouse: meluncur mulus menuju posisi jari (easing)
      const dx = (pointerTarget - ship.x) * 0.32;
      ship.vx += (dx - ship.vx) * 0.55;
    } else {
      const targetVx = (right ? speed : 0) - (left ? speed : 0);
      ship.vx += (targetVx - ship.vx) * 0.28;
    }
    ship.vx = Math.max(-15, Math.min(15, ship.vx));
    if (Math.abs(ship.vx) < 0.01) ship.vx = 0;
    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x + ship.vx));

    // Spawn rintangan & power-up
    const rate = Math.max(16, 44 - Math.floor(score / 40));
    if (frame % rate === 0) {
      const type = pickWeighted(
        vipMode ? vipHazardTypes : chaosMode ? chaosHazardTypes : hazardTypes,
      );
      const r = Math.random() * 12 + 13;
      let hx = Math.random() * (W - r * 2) + r;
      // 📻 Selama pengalihan aktif, meteor menjauh dari jalur pilot
      if (divertFrames > 0) {
        for (let t = 0; t < 5 && Math.abs(hx - ship.x) < 90; t++) {
          hx = Math.random() * (W - r * 2) + r;
        }
      }
      rocks.push({
        type,
        trail: type.trail || null,
        x: hx,
        y: -r * 2 - (type.label ? 12 : 0),
        r,
        vy: (Math.random() * 1.6 + 2) * difficulty() * (chaosMode ? 1.7 : 1), // 💀 Chaos: 1.7x lebih cepat
        wobble: Math.random() * 600,
        angle: type.spin ? Math.random() * Math.PI * 2 : 0,
        spin: type.spin ? (Math.random() - 0.5) * 0.08 : 0,
      });
    }
    if (frame % 160 === 0) {
      const type = pickWeighted(powerTypes);
      powerUps.push({
        type,
        x: Math.random() * (W - 40) + 20,
        y: -24,
        r: 13,
        vy: 2.4 * difficulty(),
      });
    }

    // 🐍 Python Slow-Mo memperlambat semua yang jatuh
    const slowMul = slowFrames > 0 ? 0.45 : 1;

    // Update objek
    updateFx();
    // 🔥 Api mesin: partikel kecil menyembur dari ekor roket
    if (!shipDead && exhaust.length < 30) {
      exhaust.push({
        x: ship.x + (Math.random() - 0.5) * 5 - ship.vx * 0.5,
        y: ship.y + ship.r * 0.8,
        vy: 2.6 + Math.random() * 1.4,
        life: 11,
        max: 11,
        r: 4 + Math.floor(Math.random() * 3),
      });
    }
    rocks.forEach((o) => {
      o.y += o.vy * slowMul;
      // 💀 Chaos: lintasan zigzag yang tak tertebak
      if (chaosMode) {
        o.x += Math.sin((frame + o.wobble) * 0.08) * 2.3;
        o.x = Math.max(o.r, Math.min(W - o.r, o.x));
      }
      o.angle += o.spin;
    });
    powerUps.forEach((o) => (o.y += o.vy * slowMul));
    rocks = rocks.filter((o) => o.y < H + 70);
    powerUps = powerUps.filter((o) => o.y < H + 40);

    // Tabrakan rintangan (🛡️ menyelamatkan satu benturan)
    for (let i = rocks.length - 1; i >= 0; i--) {
      const o = rocks[i];
      const jarak = Math.hypot(o.x - ship.x, o.y - ship.y);
      if (jarak < o.r + ship.r - 6) {
        if (shieldCount > 0) {
          shieldCount--;
          spawnParticles(o.x, o.y, "rgba(34, 211, 238, 0.9)", 14, 3.5);
          rocks.splice(i, 1);
          flashFrames = 10;
          combo = 0;
          comboTimer = 0;
          sfx("hit");
        } else {
          spawnParticles(ship.x, ship.y, "rgba(239, 68, 68, 0.95)", 26, 4.5);
          return gameOver();
        }
      } else if (!o.grazed && o.y > ship.y - 4 && jarak < o.r + ship.r + 30) {
        // 🔥 NYARIS! Lewat sangat dekat tanpa menabrak
        o.grazed = true;
        combo++;
        comboTimer = 240;
        const bonus = 5 * combo;
        score += bonus;
        comboPops.push({
          x: o.x,
          y: o.y - o.r,
          text:
            combo > 1 ? `NYARIS! +${bonus} (x${combo})` : `NYARIS! +${bonus}`,
          life: 55,
        });
        sfx("combo", Math.min(combo, 8));
      } else if (!o.grazed && o.y > ship.y + 30) {
        o.grazed = true; // sudah lewat, tak dihitung lagi
      }
    }
    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer === 0) combo = 0;
    }

    // Ambil power-up
    powerUps = powerUps.filter((o) => {
      if (Math.hypot(o.x - ship.x, o.y - ship.y) < o.r + ship.r) {
        applyPower(o.type);
        return false;
      }
      return true;
    });

    // 🛰️ Wingman Drone: mengorbit roket & menembak rintangan terdekat
    if (drone) {
      drone.angle += 0.05;
      drone.x = ship.x + Math.cos(drone.angle) * 38;
      drone.y = ship.y - 6 + Math.sin(drone.angle) * 22;
      if (droneCooldown > 0) droneCooldown--;
      if (droneCooldown <= 0 && (boss || rocks.length)) {
        let tx;
        let ty;
        if (boss) {
          // prioritaskan boss
          boss.hp--;
          tx = boss.x;
          ty = boss.y;
          spawnParticles(boss.x, boss.y, "rgba(167, 139, 250, 0.9)", 8, 2.5);
        } else {
          let ti = 0;
          let td = Infinity;
          rocks.forEach((o, i) => {
            const d = Math.hypot(o.x - drone.x, o.y - drone.y);
            if (d < td) {
              td = d;
              ti = i;
            }
          });
          const target = rocks[ti];
          tx = target.x;
          ty = target.y;
          spawnParticles(tx, ty, "rgba(52, 211, 153, 0.9)", 10, 3);
          rocks.splice(ti, 1);
          score += 3; // bonus hancurkan rintangan
        }
        lasers.push({ x1: drone.x, y1: drone.y, x2: tx, y2: ty, life: 14 });
        sfx("laser");
        droneCooldown = 180 + Math.floor(Math.random() * 120); // 3–5 detik
      }
    }

    // 👾 Boss "Segmentation Fault" tiap 1.000 poin
    if (!boss && Math.floor(score / 1000) > bossesSpawned) {
      bossesSpawned++;
      boss = { x: W / 2, y: 74, hp: 6, t: 0 };
      toastQueue.push({
        text: "👾 BOSS: Segmentation Fault terdeteksi! Bertahan 15 detik atau hancurkan!",
        at: frame + 5,
      });
      sfx("boss");
    }
    if (boss) {
      boss.t++;
      boss.x = W / 2 + Math.sin(boss.t * 0.025) * (W * 0.33);
      boss.y = 74 + Math.sin(boss.t * 0.06) * 12;
      // menjatuhkan error kecil tiap ~55 frame
      if (boss.t % 55 === 0) {
        rocks.push({
          type: { emoji: "❗", label: "Error", spin: false },
          trail: null,
          x: boss.x,
          y: boss.y + 30,
          r: 11,
          vy: 3.4 * (chaosMode ? 1.3 : 1),
          wobble: Math.random() * 600,
          angle: 0,
          spin: 0,
        });
      }
      if (boss.hp <= 0) {
        // 🎉 boss hancur
        score += 200;
        spawnParticles(boss.x, boss.y, "rgba(239, 68, 68, 0.95)", 34, 5);
        spawnParticles(boss.x, boss.y, "rgba(250, 204, 21, 0.95)", 22, 4);
        comboPops.push({
          x: boss.x,
          y: boss.y,
          text: "BOSS DIHANCURKAN! +200",
          life: 80,
        });
        toastQueue.push({
          text: "🎉 Segmentation Fault diperbaiki! +200 poin!",
          at: frame + 5,
        });
        boss = null;
        sfx("record");
      } else if (boss.t >= 900) {
        // bertahan 15 detik — boss mundur
        score += 100;
        comboPops.push({
          x: boss.x,
          y: boss.y,
          text: "BERTAHAN! +100",
          life: 80,
        });
        boss = null;
        sfx("power");
      }
    }

    // Skor bertambah seiring waktu (tulis DOM hanya saat berubah)
    if (frame % 6 === 0) score++;
    if (score !== lastShownScore) {
      lastShownScore = score;
      scoreEl.textContent = score;
    }

    // ⚔️ Tantangan teman terlampaui
    if (challenge && !challenge.beaten && score > challenge.target) {
      challenge.beaten = true;
      comboPops.push({
        x: W / 2,
        y: H / 2,
        text: `⚔️ Tantangan ${challenge.from} terlampaui!`,
        life: 90,
      });
      sfx("record");
    }
  }

  function drawLabel(text, x, y, color) {
    g.font = "600 10px Poppins, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "top";
    g.fillStyle = color;
    g.fillText(text, x, y);
  }

  function draw(alpha = 1) {
    // interpolasi posisi antara langkah logika sebelumnya & sekarang
    const lerp = (prev, cur) =>
      prev === undefined ? cur : prev + (cur - prev) * alpha;
    const sx = lerp(ship.px, ship.x);
    const sy = ship.y;
    g.clearRect(0, 0, W, H);

    // 🌌 VIP Mode: Aurora Voyager — langit hijau-ungu bercahaya
    if (vipMode) {
      g.drawImage(vipBgCache(), 0, 0);
      const sway = Math.sin(frame * 0.004) * 60;
      drawGlow("52, 211, 153", 0.18, 260, W * 0.28 + sway, H * 0.22);
      drawGlow("139, 92, 246", 0.17, 270, W * 0.72 - sway, H * 0.42);
      drawGlow("45, 212, 191", 0.13, 240, W * 0.5, H * 0.88);
    }

    // Bintang latar
    g.globalAlpha = 0.75;
    for (const d of bgDots) {
      g.fillStyle = d.color || "#ffffff";
      g.beginPath();
      g.arc(d.x, lerp(d.py, d.y), d.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    // Power-up (label cyan)
    for (const o of powerUps) {
      const oy = lerp(o.py, o.y);
      drawEmoji(o.type.emoji, o.x, oy, o.r * 2);
      drawLabel(o.type.label, o.x, oy + o.r + 3, "rgba(165, 243, 252, 0.9)");
    }

    // Rintangan (label merah untuk masalah developer)
    for (const o of rocks) {
      const ox = lerp(o.px, o.x);
      const oy = lerp(o.py, o.y);
      // 🌠 Jejak cahaya komet (VIP Mode) — goresan solid murah
      if (vipMode && o.trail) {
        const len = o.r * 3.2 + o.vy * 6;
        g.globalAlpha = 0.45;
        g.strokeStyle = o.trail === "gold" ? "#34d399" : "#a78bfa";
        g.lineWidth = 3;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(ox, oy - o.r * 0.6);
        g.lineTo(ox, oy - o.r - len);
        g.stroke();
        g.globalAlpha = 1;
      }
      drawEmoji(o.type.emoji, ox, oy, o.r * 2, lerp(o.pa, o.angle));
      if (o.type.label) {
        drawLabel(o.type.label, ox, oy + o.r + 3, "rgba(252, 165, 165, 0.9)");
      }
    }

    // 🛰️ Laser drone + drone pengawal
    for (const l of lasers) {
      g.save();
      g.globalAlpha = l.life / 14;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(l.x1, l.y1);
      g.lineTo(l.x2, l.y2);
      // goresan lebar transparan = glow murah (tanpa shadowBlur yang berat)
      g.strokeStyle = "rgba(52, 211, 153, 0.28)";
      g.lineWidth = 7;
      g.stroke();
      g.strokeStyle = "rgba(52, 211, 153, 0.95)";
      g.lineWidth = 2;
      g.stroke();
      // cincin ledakan di titik tumbukan
      g.beginPath();
      g.arc(l.x2, l.y2, (14 - l.life) * 1.5, 0, Math.PI * 2);
      g.strokeStyle = "rgba(167, 139, 250, 0.7)";
      g.lineWidth = 1.5;
      g.stroke();
      g.restore();
    }
    if (drone && !shipDead) {
      const dx = lerp(drone.px, drone.x);
      const dy = lerp(drone.py, drone.y);
      drawGlow("52, 211, 153", 0.4, 16, dx, dy);
      drawEmoji("🛰️", dx, dy, 17);
    }

    // 🔥 Api mesin roket (warna mengikuti mode)
    const flame = vipMode
      ? "52, 211, 153"
      : chaosMode
        ? "248, 113, 113"
        : boostFrames > 0
          ? "250, 204, 21"
          : "34, 211, 238";
    if (!shipDead || exhaust.length) {
      for (const e of exhaust) {
        g.globalAlpha = (e.life / e.max) * 0.9;
        drawGlow(flame, 0.85, e.r, e.x, lerp(e.py, e.y));
      }
      g.globalAlpha = 1;
    }

    // Cincin pelindung 🛡️
    if (shieldCount > 0 && !shipDead) {
      const ringColor = vipMode
        ? "rgba(52, 211, 153, 0.85)"
        : "rgba(34, 211, 238, 0.85)";
      g.beginPath();
      g.arc(sx, sy, ship.r + 11, 0, Math.PI * 2);
      g.fillStyle = vipMode
        ? "rgba(52, 211, 153, 0.07)"
        : "rgba(34, 211, 238, 0.08)";
      g.fill();
      g.strokeStyle =
        shieldCount > 1
          ? vipMode
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(250, 204, 21, 0.85)"
          : ringColor;
      g.lineWidth = 2.5;
      g.stroke();
    }

    if (!shipDead) {
      // Kapal miring sesuai arah gerak (🌌 VIP Mode: roket Aurora)
      if (vipMode) {
        drawGlow("52, 211, 153", 0.32, 36, sx, sy);
      }
      // 💀 Chaos: roket Merah Membara dengan petir di ekor
      if (chaosMode) {
        drawGlow("239, 68, 68", 0.42, 38, sx, sy);
        g.save();
        g.lineCap = "round";
        for (let k = 0; k < 2; k++) {
          g.beginPath();
          let lx = sx + (k ? 7 : -7);
          let ly = sy + 15;
          g.moveTo(lx, ly);
          for (let s = 0; s < 3; s++) {
            lx += (Math.random() - 0.5) * 15;
            ly += 9 + Math.random() * 7;
            g.lineTo(lx, ly);
          }
          g.strokeStyle = "rgba(239, 68, 68, 0.3)";
          g.lineWidth = 6;
          g.stroke();
          g.strokeStyle = "rgba(252, 165, 165, 0.95)";
          g.lineWidth = 2;
          g.stroke();
        }
        g.restore();
      }
      drawEmoji(shipSkin, sx, sy, ship.r * 2.3, ship.vx * 0.045 - 0.78);
      if (vipMode) {
        drawEmoji("✨", sx + 9, sy + 10, 12); // lencana edisi Aurora
      }
      if (chaosMode) {
        drawEmoji("🔥", sx + 9, sy + 12, 12); // ekor api sang rival
      }
    }

    // 💥 Partikel (kotak kecil — lebih murah dari arc, tetap terlihat retro)
    for (const p of particles) {
      g.globalAlpha = Math.min(Math.max(p.life / p.max, 0), 1);
      g.fillStyle = p.color;
      const px = lerp(p.px, p.x);
      const py = lerp(p.py, p.y);
      g.fillRect(px - p.r, py - p.r, p.r * 2, p.r * 2);
    }
    g.globalAlpha = 1;

    // 👾 Boss Segmentation Fault
    if (boss) {
      const bx = lerp(boss.px, boss.x);
      const by = lerp(boss.py, boss.y);
      drawGlow("239, 68, 68", 0.35, 52, bx, by);
      drawEmoji("🐛", bx, by, 52, Math.sin(boss.t * 0.05) * 0.2);
      // bar nyawa
      const bw = 76;
      g.fillStyle = "rgba(255, 255, 255, 0.18)";
      g.fillRect(bx - bw / 2, by - 46, bw, 6);
      g.fillStyle = "rgba(239, 68, 68, 0.9)";
      g.fillRect(bx - bw / 2, by - 46, (bw * Math.max(boss.hp, 0)) / 6, 6);
      drawLabel("SEGMENTATION FAULT", bx, by - 40, "rgba(252, 165, 165, 0.95)");
    }

    // 🔥 Teks combo mengambang
    for (const c of comboPops) {
      g.globalAlpha = Math.min(Math.max(c.life / 55, 0), 1);
      g.font = "700 13px Poppins, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "#fde68a";
      g.fillText(c.text, c.x, c.y);
    }
    g.globalAlpha = 1;

    // Indikator efek aktif (kiri atas kanvas)
    const fx = [];
    if (boostFrames > 0) fx.push(`⚡ JS Boost ${Math.ceil(boostFrames / 60)}s`);
    if (slowFrames > 0) fx.push(`🐍 Slow-Mo ${Math.ceil(slowFrames / 60)}s`);
    if (shieldCount > 0) fx.push(`🛡️ Shield x${shieldCount}`);
    if (drone) fx.push(`🛰️ Drone siap ${Math.ceil(droneCooldown / 60)}s`);
    if (chaosMode) fx.push("💀 Protokol Rival AKTIF");
    if (combo >= 2) fx.push(`🔥 Combo x${combo}`);
    if (challenge && !challenge.beaten) {
      fx.push(`🎯 Target ${challenge.from}: ${challenge.target}`);
    }
    g.font = "600 13px Poppins, sans-serif";
    g.textAlign = "left";
    g.textBaseline = "top";
    g.fillStyle = "rgba(232, 232, 245, 0.92)";
    fx.forEach((t, i) => g.fillText(t, 12, 12 + i * 21));

    // Kilat saat shield pecah / 🔥 blast (hijau aurora di VIP Mode)
    if (flashFrames > 0) {
      g.fillStyle = vipMode
        ? `rgba(52, 211, 153, ${flashFrames / 40})`
        : `rgba(255, 170, 60, ${flashFrames / 40})`;
      g.fillRect(0, 0, W, H);
    }

    // 📟 Hologram pembuka VIP Mode
    if (vipMode && holoFrames > 0) {
      const age = 300 - holoFrames;
      let alpha = 1;
      if (age < 30) alpha = age / 30;
      if (holoFrames < 45) alpha = holoFrames / 45;
      alpha *= 0.88 + 0.12 * Math.sin(frame * 0.55); // kedip halus hologram

      const pw = Math.min(500, W - 40);
      const ph = 92;
      const px = (W - pw) / 2;
      const py = 46;

      g.save();
      g.globalAlpha = Math.max(alpha, 0);
      g.beginPath();
      if (g.roundRect) g.roundRect(px, py, pw, ph, 12);
      else g.rect(px, py, pw, ph);
      g.fillStyle = "rgba(34, 211, 238, 0.06)";
      g.fill();
      g.strokeStyle = "rgba(52, 211, 153, 0.7)";
      g.lineWidth = 1.5;
      g.stroke();

      // garis pindai hologram
      g.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (let yy = py + 5; yy < py + ph - 5; yy += 6) {
        g.fillRect(px + 5, yy, pw - 10, 1);
      }

      g.textAlign = "center";
      g.textBaseline = "top";
      g.shadowColor = "rgba(52, 211, 153, 0.9)";
      g.shadowBlur = 12;
      g.fillStyle = "#a7f3d0";
      g.font = "700 13px 'Orbitron', monospace";
      g.fillText(vipMsg[0], W / 2, py + 20);
      g.shadowColor = "rgba(139, 92, 246, 0.9)";
      g.fillStyle = "#c4b5fd";
      g.font = "600 14px Poppins, sans-serif";
      g.fillText(vipMsg[1], W / 2, py + 52);
      g.restore();
    }

    // 🔔 Notifikasi eksklusif (toast kecil)
    if (activeToast) {
      let a = 1;
      if (activeToast.life > 150) a = (170 - activeToast.life) / 20;
      if (activeToast.life < 30) a = activeToast.life / 30;
      g.save();
      g.globalAlpha = Math.max(a, 0);
      g.font = "600 12px Poppins, sans-serif";
      const tw = g.measureText(activeToast.text).width + 34;
      const tx = (W - tw) / 2;
      const ty = holoFrames > 0 ? 150 : 52;
      g.beginPath();
      if (g.roundRect) g.roundRect(tx, ty, tw, 30, 999);
      else g.rect(tx, ty, tw, 30);
      g.fillStyle = "rgba(4, 20, 26, 0.78)";
      g.fill();
      g.strokeStyle = "rgba(52, 211, 153, 0.55)";
      g.lineWidth = 1;
      g.stroke();
      g.fillStyle = "#a7f3d0";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(activeToast.text, W / 2, ty + 16);
      g.restore();
    }

    // 📻 Kotak transmisi Mission Control (pojok kiri bawah)
    if (transmissionFrames > 0) {
      const total = 460;
      const age = total - transmissionFrames;
      let a = 1;
      if (age < 20) a = age / 20;
      if (transmissionFrames < 35) a = transmissionFrames / 35;

      const bw = Math.min(324, W - 24);
      const bh = 104;
      const bx = 12;
      const by = H - bh - 12;

      g.save();
      g.globalAlpha = Math.max(a, 0);
      g.beginPath();
      if (g.roundRect) g.roundRect(bx, by, bw, bh, 10);
      else g.rect(bx, by, bw, bh);
      g.fillStyle = "rgba(4, 16, 24, 0.85)";
      g.fill();
      g.strokeStyle = "rgba(52, 211, 153, 0.6)";
      g.lineWidth = 1.2;
      g.stroke();
      // lampu siaran berkedip
      g.fillStyle =
        Math.floor(frame / 20) % 2
          ? "rgba(52, 211, 153, 0.95)"
          : "rgba(52, 211, 153, 0.25)";
      g.beginPath();
      g.arc(bx + 15, by + 15, 4, 0, Math.PI * 2);
      g.fill();
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillStyle = "#a7f3d0";
      g.font = "700 10px 'Orbitron', monospace";
      g.fillText("PUSAT KONTROL MISI — TRANSMISI AUDIO", bx + 27, by + 10);
      // pesan dengan efek ketik radio + bungkus baris
      const msg =
        `"Anomali terdeteksi! Manuver Pilot ${playerName} di atas ` +
        `rata-rata protokol. Sistem mengalihkan sebagian meteor dari ` +
        `jalurnya... Semoga berhasil, Pilot!"`;
      const shown = msg.slice(0, Math.floor(age * 1.4));
      g.fillStyle = "#d1fae5";
      g.font = "italic 11px Poppins, sans-serif";
      const words = shown.split(" ");
      let line = "";
      let ly = by + 30;
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (g.measureText(test).width > bw - 42) {
          g.fillText(line, bx + 27, ly);
          ly += 15;
          line = w;
        } else {
          line = test;
        }
      }
      g.fillText(line, bx + 27, ly);
      g.restore();
    }

    // ⏳ Hitung mundur setelah jeda — pemain siap sebelum meteor bergerak
    if (resumeCountdown > 0) {
      const n = Math.ceil(resumeCountdown / 450);
      const t = (resumeCountdown % 450) / 450; // 1 → 0 tiap angka
      g.save();
      g.fillStyle = "rgba(5, 5, 16, 0.45)";
      g.fillRect(0, 0, W, H);
      g.globalAlpha = Math.min(1, t * 2.2);
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "#e9d5ff";
      g.font = `700 ${Math.round(54 + (1 - t) * 26)}px Orbitron, monospace`;
      g.fillText(String(n), W / 2, H / 2);
      g.restore();
    }
  }

  // ⏱️ Fixed timestep: logika selalu 60 langkah/detik di monitor 60Hz, 120Hz,
  // maupun HP lambat. Render tiap frame layar dengan interpolasi (alpha)
  // sehingga gerakan tetap halus walau refresh rate ≠ 60 Hz.
  const STEP = 1000 / 60;
  function loop(now) {
    if (!playing) return;
    if (!lastTime) lastTime = now;
    const dt = Math.min(now - lastTime, 100); // clamp bila tab sempat tersembunyi
    lastTime = now;
    if (resumeCountdown > 0) {
      resumeCountdown = Math.max(0, resumeCountdown - dt);
      draw(1);
      requestAnimationFrame(loop);
      return;
    }
    acc += dt;
    while (acc >= STEP && playing) {
      update();
      acc -= STEP;
    }
    if (playing) {
      draw(acc / STEP);
      requestAnimationFrame(loop);
    }
  }

  // 💥 Ledakan roket dimainkan ±0,7 detik sebelum panel hasil muncul
  function playDeath(done) {
    dying = true;
    let last = performance.now();
    const t0 = last;
    let a = 0;
    (function step(now) {
      a += Math.min(now - last, 100);
      last = now;
      while (a >= STEP) {
        for (const p of particles) {
          p.px = p.x;
          p.py = p.y;
        }
        for (const d of bgDots) d.py = d.y;
        for (const e of exhaust) e.py = e.y;
        updateFx();
        a -= STEP;
      }
      draw(a / STEP);
      if (now - t0 < 700) requestAnimationFrame(step);
      else {
        dying = false;
        done();
      }
    })(t0);
  }

  function pauseGame() {
    if (!playing) return false;
    playing = false;
    announcePlaying(false);
    keys = {};
    return true;
  }
  function resumeGame() {
    if (playing) return;
    playing = true;
    announcePlaying(true);
    lastTime = 0; // reset timer agar tak ada lompatan setelah jeda
    acc = 0;
    resumeCountdown = 1350; // 3 · 2 · 1
    requestAnimationFrame(loop);
  }

  let starting = false;
  async function start() {
    if (playing || dying || starting) return;
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.classList.add("error");
      nameInput.placeholder = "Isi nama pilotmu dulu! ✋";
      nameInput.focus();
      return;
    }
    if (updateNameHint()) {
      nameInput.classList.add("error");
      nameInput.focus();
      return;
    }
    starting = true;
    playerName = name;
    localStorage.setItem("astroDodgeName", playerName);
    playerEl.textContent = playerName;
    bestEl.textContent = getBest(playerName);

    // Kalibrasi profil penerbangan pilot
    const signature = await flightSignature(name);
    vipMode = calibrationProfiles.includes(signature);
    chaosMode = !vipMode && rivalProfiles.includes(signature);
    frameEl.classList.toggle("vip", vipMode);
    frameEl.classList.toggle("chaos", chaosMode);
    overlay.classList.remove("vip-holo");
    overlay.classList.remove("chaos-holo");
    goResult.classList.add("hidden");
    holoFrames = vipMode ? 300 : 0;
    if (vipMode) {
      const pick = vipMessages[Math.floor(Math.random() * vipMessages.length)];
      vipMsg = [
        pick[0].replace("{NAME}", playerName.toUpperCase()),
        pick[1].replace("{NAME}", playerName),
      ];
    }

    reset();
    // 🚀 Validasi skin: bila skin terpilih belum terbuka utk pilot ini, pakai klasik
    const ownedSkins = unlockedBadges(playerName);
    const chosen = skins.find((s) => s.emoji === shipSkin);
    if (chosen && chosen.need && !ownedSkins.has(chosen.need)) {
      shipSkin = "🚀";
    }
    // 🎮 Bonus stat VIP: roket lebih lincah + 1 shield gratis
    ship.speed = vipMode ? 6.8 : 6;
    if (vipMode) shieldCount = 1;

    // 🛰️ Wingman Drone + notifikasi eksklusif (setelah hologram)
    drone = vipMode ? { angle: 0, x: ship.x + 38, y: ship.y - 6 } : null;
    droneCooldown = 180;
    if (vipMode) {
      toastQueue = [
        { text: "✨ Secret Galaxy Unlocked: Aurora Voyager Mode.", at: 320 },
        {
          text: "🚀 Pilot VIP Terpilih: Mengoperasikan Drone Pertahanan Otomatis.",
          at: 510,
        },
      ];
    }
    // 💀 Sambutan hangat untuk para rival
    if (chaosMode) {
      toastQueue = [
        {
          text: `⚠️ WARNING: Pilot ${playerName} terdeteksi — Protokol "Buktikan Skill-mu, Noob!" AKTIF 💀`,
          at: 40,
        },
      ];
    }

    playing = true;
    starting = false;
    lastTime = 0;
    acc = 0;
    announcePlaying(true);
    if (window.cosmicDB) window.cosmicDB.startSession(); // ⏱️ waktu mulai versi server
    sfx("power"); // 🔊 aktifkan audio lewat gesture pengguna
    overlay.classList.add("hidden");
    requestAnimationFrame(loop);
  }

  // Skor akhir menghitung naik dengan easing
  function animateScore(target) {
    const startT = performance.now();
    const dur = 900;
    (function tick(now) {
      const p = Math.min((now - startT) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      goScore.textContent = Math.round(target * eased);
      if (p < 1 && !playing) requestAnimationFrame(tick);
    })(startT);
  }
  function gameOver() {
    playing = false;
    shipDead = true;
    announcePlaying(false);
    const prevBest = getBest(playerName);
    const { rank, improved, newBadges } = submitScore(
      playerName,
      score,
      cleanerEarned,
      vipMode,
      chaosMode,
    );
    const isRecord = improved && score > 0 && prevBest > 0;
    // 🌐 Kirim hasil terbaik pilot ini ke papan global
    const myEntry = board.find(
      (e) => e.name.toLowerCase() === playerName.toLowerCase(),
    );
    nameHint.textContent = "";
    if (myEntry && window.cosmicDB) {
      window.cosmicDB.submit(myEntry).then((res) => {
        if (res && res.reason === "name-taken") {
          nameHint.textContent =
            "⚠️ Nama ini milik pilot lain — skor hanya tersimpan di perangkatmu.";
        } else if (res && res.reason === "claim-needed") {
          nameHint.textContent =
            "🏁 Pecahkan skor lama nama ini untuk mengklaimnya di papan global.";
        } else if (res && res.reason === "rejected") {
          nameHint.textContent =
            "🌐 Skor tidak diterima papan global (gagal verifikasi).";
        }
      });
    }

    // Judul & kalimat singkat — angka-angka tampil di panel hasil
    if (vipMode) {
      overlayTitle.textContent = isRecord
        ? "Anomali Skor Terdeteksi ⚡"
        : "Penerbangan Selesai 🌟";
      overlayText.textContent = isRecord
        ? `Wah, pilotnya jago juga nih! Rekor baru untuk kategori ${playerName}. 🏅`
        : `Data penerbangan ${playerName} tercatat. Sistem menanti manuver berikutnya. 🛰️`;
    } else if (chaosMode) {
      // 💀 Roasting khusus rival — tak peduli rekor atau bukan
      overlayTitle.textContent = "Protokol Rival: GAGAL 💀";
      const roast = chaosRoasts[Math.floor(Math.random() * chaosRoasts.length)];
      overlayText.textContent = roast.replace("{NAME}", playerName);
    } else if (isRecord) {
      overlayTitle.textContent = "Rekor Baru! 🏆";
      overlayText.textContent = `Rekor pribadimu pecah, ${playerName} — galaksi mencatat namamu ✨`;
    } else if (rank === 1) {
      overlayTitle.textContent = "Sang Juara Galaksi! 👑";
      overlayText.textContent = `${playerName} masih tak tergoyahkan di puncak papan peringkat.`;
    } else {
      overlayTitle.textContent = "Game Over 💥";
      const phrases = [
        "Roketmu terhenti, tapi semangat pilot tidak. 💫",
        "Asteroid 1 — Roket 0. Waktunya balas dendam! 😤",
        "Setiap pilot legendaris pernah jatuh. Bangkit lagi! 🚀",
        "Hampir saja! Satu manuver lagi menuju rekor. 🌠",
      ];
      overlayText.textContent =
        phrases[Math.floor(Math.random() * phrases.length)];
    }

    // 📊 Panel hasil ala arcade
    goResult.classList.remove("hidden");
    goResult.classList.toggle("record", isRecord || rank === 1);
    goRank.textContent = `#${rank}`;
    goTime.textContent = `${Math.round(frame / 60)}s`;
    goPower.textContent = powerTaken;

    // 🎖️ Chip lencana baru (muncul pop berurutan)
    goBadges.innerHTML = "";
    goBadges.classList.toggle("hidden", newBadges.length === 0);
    if (newBadges.length) {
      const label = document.createElement("small");
      label.className = "go-badges-label";
      label.textContent = "🎖️ LENCANA BARU";
      goBadges.appendChild(label);
      newBadges.forEach((b, i) => {
        const chip = document.createElement("span");
        chip.className = "go-badge";
        chip.style.animationDelay = `${0.35 + i * 0.18}s`;
        chip.textContent = `${b.emoji} ${b.name}`;
        goBadges.appendChild(chip);
      });
    }

    // 💥 Guncangan layar saat tabrakan
    frameEl.classList.add("shake");
    setTimeout(() => frameEl.classList.remove("shake"), 500);

    // 🔊 Suara kalah / rekor
    sfx("over");
    if (isRecord || rank === 1) setTimeout(() => sfx("record"), 550);

    // ⚔️ Hasil tantangan teman
    if (challenge) {
      overlayText.textContent +=
        score > challenge.target
          ? ` 🎉 Kamu mengalahkan tantangan ${challenge.from} (${challenge.target})!`
          : ` ⚔️ Tantangan ${challenge.from}: kurang ${challenge.target - score + 1} poin lagi.`;
    }

    // 📤 Simpan hasil untuk kartu skor & link tantangan
    lastRun = {
      score,
      rank,
      name: playerName,
      seconds: Math.round(frame / 60),
      skin: shipSkin,
      badges: myEntry ? badgeIcons(myEntry) : [],
    };
    shareImage = makeShareImage().catch(() => null);

    overlay.classList.toggle("vip-holo", vipMode);
    overlay.classList.toggle("chaos-holo", chaosMode);
    bestEl.textContent = getBest(playerName);
    startBtn.textContent = vipMode
      ? "Terbang Lagi 🌟"
      : chaosMode
        ? "Coba Lagi (Biar Enggak Malu) 😏"
        : "Main Lagi 🔁";
    renderBoard(playerName);
    renderSkins(); // lencana baru bisa membuka skin baru
    // panel hasil muncul setelah animasi ledakan selesai
    playDeath(() => {
      overlay.classList.remove("hidden");
      animateScore(score);
    });
  }

  startBtn.addEventListener("click", start);

  // 📸 Kartu skor 1080×1920 (ukuran IG/WA Story) + link tantangan
  function challengeLink() {
    const u = new URL(SITE_URL);
    u.searchParams.set("challenge", String(lastRun.score));
    u.searchParams.set("from", lastRun.name);
    u.hash = "game";
    return u.toString();
  }

  async function makeShareImage() {
    const c = document.createElement("canvas");
    c.width = 1080;
    c.height = 1920;
    const x = c.getContext("2d");
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load("700 80px Orbitron"),
        document.fonts.load("600 40px Poppins"),
      ]).catch(() => {});
    }
    const bg = x.createLinearGradient(0, 0, 0, 1920);
    bg.addColorStop(0, "#0b0626");
    bg.addColorStop(0.5, "#050510");
    bg.addColorStop(1, "#071a2b");
    x.fillStyle = bg;
    x.fillRect(0, 0, 1080, 1920);
    const nebula = (cx, cy, r, rgb) => {
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, `rgba(${rgb}, 0.35)`);
      rg.addColorStop(1, `rgba(${rgb}, 0)`);
      x.fillStyle = rg;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
    };
    nebula(200, 380, 520, "139, 92, 246");
    nebula(900, 1400, 560, "34, 211, 238");
    nebula(620, 900, 420, "236, 72, 153");
    x.fillStyle = "#ffffff";
    for (let i = 0; i < 220; i++) {
      x.globalAlpha = Math.random() * 0.8 + 0.2;
      x.beginPath();
      x.arc(Math.random() * 1080, Math.random() * 1920, Math.random() * 2.4 + 0.6, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 1;
    x.textAlign = "center";
    x.textBaseline = "middle";

    x.fillStyle = "#a5f3fc";
    x.font = "700 64px Orbitron, sans-serif";
    x.fillText("ASTRO DODGE", 540, 250);
    x.fillStyle = "rgba(232, 232, 245, 0.75)";
    x.font = "500 38px Poppins, sans-serif";
    x.fillText("mini game di portofolio Amboyy", 540, 325);

    x.save();
    x.translate(540, 610);
    x.rotate(-0.78);
    x.font = "220px serif";
    x.fillText(lastRun.skin, 0, 0);
    x.restore();

    x.fillStyle = "rgba(232, 232, 245, 0.85)";
    x.font = "600 46px Poppins, sans-serif";
    x.fillText(`Pilot ${lastRun.name}`, 540, 860);

    const sg = x.createLinearGradient(200, 0, 880, 0);
    sg.addColorStop(0, "#8b5cf6");
    sg.addColorStop(0.5, "#ec4899");
    sg.addColorStop(1, "#22d3ee");
    x.fillStyle = sg;
    let size = 230;
    do {
      x.font = `700 ${size}px Orbitron, sans-serif`;
      size -= 10;
    } while (x.measureText(String(lastRun.score)).width > 900 && size > 80);
    x.fillText(String(lastRun.score), 540, 1040);

    x.fillStyle = "#e8e8f5";
    x.font = "600 44px Poppins, sans-serif";
    x.fillText(
      `POIN · peringkat #${lastRun.rank} · ${lastRun.seconds} detik`,
      540,
      1200,
    );
    if (lastRun.badges.length) {
      x.font = "500 38px Poppins, sans-serif";
      x.fillStyle = "#fde68a";
      x.fillText(
        lastRun.badges.map((b) => `${b.emoji} ${b.name}`).join("  ·  "),
        540,
        1285,
      );
    }

    x.beginPath();
    if (x.roundRect) x.roundRect(120, 1420, 840, 260, 40);
    else x.rect(120, 1420, 840, 260);
    x.fillStyle = "rgba(139, 92, 246, 0.18)";
    x.fill();
    x.strokeStyle = "rgba(34, 211, 238, 0.6)";
    x.lineWidth = 3;
    x.stroke();
    x.fillStyle = "#fde68a";
    x.font = "700 56px Poppins, sans-serif";
    x.fillText("Berani kalahkan skorku? 🚀", 540, 1508);
    x.fillStyle = "#a5f3fc";
    x.font = "600 40px Poppins, sans-serif";
    x.fillText("emil-02.github.io/Web_Amboyy", 540, 1600);
    x.fillStyle = "rgba(232, 232, 245, 0.6)";
    x.font = "500 34px Poppins, sans-serif";
    x.fillText("✦ @amboyybuild ✦", 540, 1790);

    return new Promise((resolve) => c.toBlob(resolve, "image/png"));
  }

  function flashButton(btn, label) {
    if (!btn.dataset.label) btn.dataset.label = btn.textContent.trim();
    btn.textContent = label;
    clearTimeout(btn._flash);
    btn._flash = setTimeout(() => (btn.textContent = btn.dataset.label), 2400);
  }

  const shareBtn = document.getElementById("go-share");
  const linkBtn = document.getElementById("go-link");
  shareBtn.addEventListener("click", async () => {
    if (!lastRun) return;
    const text = `Aku mencetak ${lastRun.score} poin di Astro Dodge 🚀 Berani kalahkan aku? 👉 ${challengeLink()}`;
    try {
      const blob = await (shareImage || (shareImage = makeShareImage()));
      if (!blob) throw new Error("no-image");
      const file = new File([blob], `astro-dodge-${lastRun.score}.png`, {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        flashButton(shareBtn, "Gambar tersimpan ✓");
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      if (navigator.share) navigator.share({ text }).catch(() => {});
      else flashButton(shareBtn, "Gagal membuat gambar 😢");
    }
  });
  linkBtn.addEventListener("click", async () => {
    if (!lastRun) return;
    const text = `Aku mencetak ${lastRun.score} poin di Astro Dodge 🚀 Berani kalahkan aku? 👉 ${challengeLink()}`;
    try {
      await navigator.clipboard.writeText(text);
      flashButton(linkBtn, "Link tersalin ✓");
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener",
      );
    }
  });

  // 🔊 Tombol mute
  const muteBtn = document.getElementById("game-mute");
  muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem("astroMuted", muted ? "1" : "0");
    muteBtn.textContent = muted ? "🔇" : "🔊";
    if (!muted) sfx("power");
  });

  // Input nama: Enter = mulai, ketikan tidak bocor ke kontrol game
  nameInput.addEventListener("input", () => {
    nameInput.classList.remove("error");
    renderSkins(); // skin yang terbuka mengikuti nama yang diketik
    updateNameHint();
  });
  nameInput.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") start();
  });

  // Keyboard (cegah halaman ikut scroll saat main)
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (playing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => (keys[e.key] = false));
  // Tombol "nyangkut" saat jendela kehilangan fokus (Alt+Tab, notifikasi)
  window.addEventListener("blur", () => (keys = {}));

  // Sentuh, pena, & mouse lewat Pointer Events — target di-easing di update()
  const finePointer = window.matchMedia("(pointer: fine)");
  function pointerMove(clientX) {
    const rect = cv.getBoundingClientRect();
    pointerTarget = Math.max(
      ship.r,
      Math.min(W - ship.r, ((clientX - rect.left) / rect.width) * W),
    );
  }
  cv.addEventListener("pointerdown", (e) => {
    if (!playing || e.pointerType === "mouse") return;
    e.preventDefault();
    pointerMove(e.clientX); // ketuk = roket meluncur ke titik itu
  });
  cv.addEventListener("pointermove", (e) => {
    if (!playing) return;
    if (e.pointerType === "mouse" && !finePointer.matches) return;
    pointerMove(e.clientX);
  });

  // ---- Peraturan game (tombol ? di HUD) ----
  const rulesEl = document.getElementById("game-rules");
  const helpBtn = document.getElementById("game-help");
  let pausedByRules = false;

  function openRules() {
    if (pauseGame()) pausedByRules = true; // jeda dulu, lanjut setelah ditutup
    rulesEl.classList.remove("hidden");
  }
  function closeRules() {
    rulesEl.classList.add("hidden");
    if (pausedByRules) {
      pausedByRules = false;
      resumeGame();
    }
  }
  helpBtn.addEventListener("click", openRules);
  document.getElementById("rules-close").addEventListener("click", closeRules);
  document.getElementById("rules-ok").addEventListener("click", closeRules);
  rulesEl.addEventListener("click", (e) => {
    if (e.target === rulesEl) closeRules();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !rulesEl.classList.contains("hidden")) {
      closeRules();
    }
  });

  // ⏸️ Pindah tab / layar HP mati → game dijeda, lanjut dengan hitung mundur
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (pauseGame()) pausedByVisibility = true;
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      if (rulesEl.classList.contains("hidden")) resumeGame();
      else pausedByRules = true;
    }
  });

  // Ketajaman kanvas mengikuti zoom browser / pindah monitor
  window.addEventListener("resize", fitCanvas);

  // Gambar kondisi awal di belakang overlay
  makeBgDots();
  fitCanvas();
  draw();
  renderBoard(playerName);
  renderSkins();
  if (playerName) {
    playerEl.textContent = playerName;
    bestEl.textContent = getBest(playerName);
  }
  // Papan global mungkin sudah tiba sebelum game.js selesai dimuat
  if (Array.isArray(window.cosmicBoard)) applyGlobalBoard(window.cosmicBoard);
})();

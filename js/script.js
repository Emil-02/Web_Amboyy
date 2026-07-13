/* ============================================================
   NOVA — Interaksi & animasi semesta
   ============================================================ */

// ===== 1. Starfield: bintang berkelip + shooting star =====
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let shootingStars = [];
let mouseX = 0,
  mouseY = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createStars();
}

function createStars() {
  const count = Math.min(
    260,
    Math.floor((canvas.width * canvas.height) / 4500),
  );
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.3 + 0.3,
    depth: Math.random() * 0.6 + 0.2, // untuk parallax
    twinkleSpeed: Math.random() * 0.02 + 0.005,
    twinklePhase: Math.random() * Math.PI * 2,
    color:
      Math.random() > 0.85
        ? "#a5f3fc"
        : Math.random() > 0.7
          ? "#ddd6fe"
          : "#ffffff",
  }));
}

function spawnShootingStar() {
  shootingStars.push({
    x: Math.random() * canvas.width * 0.8,
    y: Math.random() * canvas.height * 0.35,
    len: Math.random() * 120 + 80,
    speed: Math.random() * 7 + 7,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
    life: 1,
  });
  // Jadwalkan shooting star berikutnya (2–7 detik)
  setTimeout(spawnShootingStar, Math.random() * 5000 + 2000);
}

function drawStars(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bintang
  for (const s of stars) {
    const twinkle =
      0.55 + 0.45 * Math.sin(time * s.twinkleSpeed + s.twinklePhase);
    const px = s.x + mouseX * s.depth * 18;
    const py = s.y + mouseY * s.depth * 18;

    ctx.beginPath();
    ctx.arc(px, py, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = twinkle;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Shooting star
  shootingStars = shootingStars.filter((m) => m.life > 0);
  for (const m of shootingStars) {
    const dx = Math.cos(m.angle) * m.speed;
    const dy = Math.sin(m.angle) * m.speed;

    const grad = ctx.createLinearGradient(
      m.x,
      m.y,
      m.x - Math.cos(m.angle) * m.len,
      m.y - Math.sin(m.angle) * m.len,
    );
    grad.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(
      m.x - Math.cos(m.angle) * m.len,
      m.y - Math.sin(m.angle) * m.len,
    );
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();

    m.x += dx;
    m.y += dy;
    m.life -= 0.012;
  }

  requestAnimationFrame(drawStars);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

resizeCanvas();
requestAnimationFrame(drawStars);
setTimeout(spawnShootingStar, 1500);

// ===== 2. Efek ketik di hero =====
const roles = [
  "Software Developer 💻",
  "Flutter & Mobile Enthusiast 📱",
  "UI/UX Design Enthusiast 🎨",
  "AI & Computational Explorer 🤖",
];
const typingEl = document.getElementById("typing-text");
let roleIdx = 0,
  charIdx = 0,
  deleting = false;

function typeLoop() {
  const current = roles[roleIdx];

  typingEl.textContent = deleting
    ? current.slice(0, --charIdx)
    : current.slice(0, ++charIdx);

  let delay = deleting ? 40 : 90;

  if (!deleting && charIdx === current.length) {
    delay = 1800; // jeda saat kalimat selesai
    deleting = true;
  } else if (deleting && charIdx === 0) {
    deleting = false;
    roleIdx = (roleIdx + 1) % roles.length;
    delay = 400;
  }

  setTimeout(typeLoop, delay);
}
typeLoop();

// ===== 3. Reveal saat scroll (IntersectionObserver) =====
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);
document
  .querySelectorAll(".reveal")
  .forEach((el) => revealObserver.observe(el));

// ===== 4. Skill bar terisi saat terlihat =====
const skillObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = bar.dataset.level + "%";
        skillObserver.unobserve(bar);
      }
    }
  },
  { threshold: 0.4 },
);
document
  .querySelectorAll(".skill-progress")
  .forEach((el) => skillObserver.observe(el));

// ===== 5. Angka statistik naik =====
const statObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      const target = +el.dataset.target;
      const duration = 1600;
      const start = performance.now();

      (function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      })(start);

      statObserver.unobserve(el);
    }
  },
  { threshold: 0.6 },
);
document
  .querySelectorAll(".stat-number")
  .forEach((el) => statObserver.observe(el));

// ===== 6. Navbar: efek scroll + link aktif =====
const navbar = document.getElementById("navbar");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id], header[id]");
const backToTop = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
  backToTop.classList.toggle("show", window.scrollY > 600);

  // Tandai link nav sesuai section yang terlihat
  let currentId = "beranda";
  for (const sec of sections) {
    if (window.scrollY >= sec.offsetTop - 200) currentId = sec.id;
  }
  navLinks.forEach((link) =>
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${currentId}`,
    ),
  );
});

backToTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);

// ===== 7. Menu hamburger (mobile) =====
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navMenu.classList.toggle("open");
});
navLinks.forEach((link) =>
  link.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navMenu.classList.remove("open");
  }),
);

// ===== 8. Parallax planet mengikuti kursor =====
const heroVisual = document.getElementById("hero-visual");
if (heroVisual && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * -24;
    const y = (e.clientY / window.innerHeight - 0.5) * -24;
    heroVisual.style.transform = `translate(${x}px, ${y}px)`;
  });
}

// ===== 9. Form kontak (Formspree) =====
// ⚙️ AKTIFKAN: daftar gratis di https://formspree.io → New Form →
// salin 8 karakter setelah "formspree.io/f/" ke variabel di bawah.
// Selama kosong, form berjalan dalam mode demo.
const FORMSPREE_CODE = ""; // contoh: "xayzabcd"

const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Mode demo bila belum terhubung Formspree
  if (!FORMSPREE_CODE) {
    formStatus.textContent =
      "🛰️ Sinyal terkirim! Aku akan segera membalas pesanmu.";
    form.reset();
    setTimeout(() => (formStatus.textContent = ""), 5000);
    return;
  }

  const tombol = form.querySelector("button[type=submit]");
  tombol.disabled = true;
  formStatus.textContent = "📡 Mengirim sinyal...";

  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_CODE}`, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      formStatus.textContent =
        "🛰️ Sinyal diterima! Aku akan segera membalas pesanmu.";
      form.reset();
    } else {
      formStatus.textContent =
        "☄️ Sinyal terganggu — coba lagi sebentar lagi, ya.";
    }
  } catch {
    formStatus.textContent =
      "☄️ Tidak ada koneksi — periksa internetmu lalu coba lagi.";
  } finally {
    tombol.disabled = false;
    setTimeout(() => (formStatus.textContent = ""), 6000);
  }
});

// ===== 10. Tahun otomatis di footer =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== 11. Mini Game: Astro Dodge =====
(function () {
  const cv = document.getElementById("game-canvas");
  if (!cv) return;

  const g = cv.getContext("2d");
  const W = cv.width;
  const H = cv.height;

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
  window.addEventListener("cosmic:board", (e) => {
    board = e.detail;
    localStorage.setItem("astroDodgeBoard", JSON.stringify(board));
    renderBoard(playerName);
    if (playerName) bestEl.textContent = getBest(playerName);
  });

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

  function drawEmoji(emoji, x, y, size, angle = 0) {
    g.save();
    g.translate(x, y);
    if (angle) g.rotate(angle);
    g.font = `${size}px serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(emoji, 0, 0);
    g.restore();
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
    lasers = [];
    toastQueue = [];
    activeToast = null;
    transmissionShown = false;
    transmissionFrames = 0;
    divertFrames = 0;
    ship.x = W / 2;
    ship.vx = 0;
    scoreEl.textContent = "0";
    makeBgDots();
  }

  function difficulty() {
    return 1 + Math.min(score / 400, 2.2); // makin tinggi skor, makin cepat
  }

  function applyPower(type) {
    powerTaken++;
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
        rocks = [];
        flashFrames = 14;
        break;
    }
  }

  function update() {
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

    // Gerak kapal (⚡ JS Boost = lebih gesit)
    const speed = boostFrames > 0 ? 9 : ship.speed;
    const left = keys.ArrowLeft || keys.a || keys.A;
    const right = keys.ArrowRight || keys.d || keys.D;
    ship.vx = (right ? speed : 0) - (left ? speed : 0);
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
    for (const d of bgDots) {
      d.y += d.vy;
      if (d.y > H) {
        d.y = -2;
        d.x = Math.random() * W;
      }
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
      if (Math.hypot(o.x - ship.x, o.y - ship.y) < o.r + ship.r - 6) {
        if (shieldCount > 0) {
          shieldCount--;
          rocks.splice(i, 1);
          flashFrames = 10;
        } else {
          return gameOver();
        }
      }
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
      if (droneCooldown <= 0 && rocks.length) {
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
        lasers.push({
          x1: drone.x,
          y1: drone.y,
          x2: target.x,
          y2: target.y,
          life: 14,
        });
        rocks.splice(ti, 1);
        score += 3; // bonus hancurkan rintangan
        droneCooldown = 180 + Math.floor(Math.random() * 120); // 3–5 detik
      }
    }
    lasers.forEach((l) => l.life--);
    lasers = lasers.filter((l) => l.life > 0);

    // Skor bertambah seiring waktu
    if (frame % 6 === 0) score++;
    scoreEl.textContent = score;
  }

  function drawLabel(text, x, y, color) {
    g.font = "600 10px Poppins, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "top";
    g.fillStyle = color;
    g.fillText(text, x, y);
  }

  function draw() {
    g.clearRect(0, 0, W, H);

    // � VIP Mode: Aurora Voyager — langit hijau-ungu bercahaya
    if (vipMode) {
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#04121f");
      grad.addColorStop(0.55, "#0a1b2e");
      grad.addColorStop(1, "#060d1f");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);

      const sway = Math.sin(frame * 0.004) * 60;
      let neb = g.createRadialGradient(
        W * 0.28 + sway,
        H * 0.22,
        10,
        W * 0.28 + sway,
        H * 0.22,
        260,
      );
      neb.addColorStop(0, "rgba(52, 211, 153, 0.18)");
      neb.addColorStop(1, "rgba(52, 211, 153, 0)");
      g.fillStyle = neb;
      g.fillRect(0, 0, W, H);

      neb = g.createRadialGradient(
        W * 0.72 - sway,
        H * 0.42,
        10,
        W * 0.72 - sway,
        H * 0.42,
        270,
      );
      neb.addColorStop(0, "rgba(139, 92, 246, 0.17)");
      neb.addColorStop(1, "rgba(139, 92, 246, 0)");
      g.fillStyle = neb;
      g.fillRect(0, 0, W, H);

      neb = g.createRadialGradient(
        W * 0.5,
        H * 0.88,
        10,
        W * 0.5,
        H * 0.88,
        240,
      );
      neb.addColorStop(0, "rgba(45, 212, 191, 0.13)");
      neb.addColorStop(1, "rgba(45, 212, 191, 0)");
      g.fillStyle = neb;
      g.fillRect(0, 0, W, H);
    }

    // Bintang latar
    g.globalAlpha = 0.75;
    for (const d of bgDots) {
      g.fillStyle = d.color || "#ffffff";
      g.beginPath();
      g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    // Power-up (label cyan)
    for (const o of powerUps) {
      drawEmoji(o.type.emoji, o.x, o.y, o.r * 2);
      drawLabel(o.type.label, o.x, o.y + o.r + 3, "rgba(165, 243, 252, 0.9)");
    }

    // Rintangan (label merah untuk masalah developer)
    for (const o of rocks) {
      // 🌠 Jejak cahaya komet (VIP Mode)
      if (vipMode && o.trail) {
        const len = o.r * 3.2 + o.vy * 6;
        const tg = g.createLinearGradient(
          o.x,
          o.y - o.r * 0.6,
          o.x,
          o.y - o.r - len,
        );
        tg.addColorStop(
          0,
          o.trail === "gold"
            ? "rgba(52, 211, 153, 0.6)"
            : "rgba(167, 139, 250, 0.6)",
        );
        tg.addColorStop(1, "rgba(0, 0, 0, 0)");
        g.strokeStyle = tg;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(o.x, o.y - o.r * 0.6);
        g.lineTo(o.x, o.y - o.r - len);
        g.stroke();
      }
      drawEmoji(o.type.emoji, o.x, o.y, o.r * 2, o.angle);
      if (o.type.label) {
        drawLabel(o.type.label, o.x, o.y + o.r + 3, "rgba(252, 165, 165, 0.9)");
      }
    }

    // 🛰️ Laser drone + drone pengawal
    for (const l of lasers) {
      g.save();
      g.globalAlpha = l.life / 14;
      g.strokeStyle = "rgba(52, 211, 153, 0.95)";
      g.lineWidth = 2;
      g.shadowColor = "rgba(52, 211, 153, 0.9)";
      g.shadowBlur = 10;
      g.beginPath();
      g.moveTo(l.x1, l.y1);
      g.lineTo(l.x2, l.y2);
      g.stroke();
      // cincin ledakan di titik tumbukan
      g.beginPath();
      g.arc(l.x2, l.y2, (14 - l.life) * 1.5, 0, Math.PI * 2);
      g.strokeStyle = "rgba(167, 139, 250, 0.7)";
      g.lineWidth = 1.5;
      g.stroke();
      g.restore();
    }
    if (drone) {
      const dg = g.createRadialGradient(
        drone.x,
        drone.y,
        1,
        drone.x,
        drone.y,
        16,
      );
      dg.addColorStop(0, "rgba(52, 211, 153, 0.4)");
      dg.addColorStop(1, "rgba(52, 211, 153, 0)");
      g.fillStyle = dg;
      g.beginPath();
      g.arc(drone.x, drone.y, 16, 0, Math.PI * 2);
      g.fill();
      drawEmoji("🛰️", drone.x, drone.y, 17);
    }

    // Cincin pelindung 🛡️
    if (shieldCount > 0) {
      const ringColor = vipMode
        ? "rgba(52, 211, 153, 0.85)"
        : "rgba(34, 211, 238, 0.85)";
      g.beginPath();
      g.arc(ship.x, ship.y, ship.r + 11, 0, Math.PI * 2);
      g.fillStyle = vipMode
        ? "rgba(52, 211, 153, 0.07)"
        : "rgba(34, 211, 238, 0.08)";
      g.fill();
      g.beginPath();
      g.arc(ship.x, ship.y, ship.r + 11, 0, Math.PI * 2);
      g.strokeStyle =
        shieldCount > 1
          ? vipMode
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(250, 204, 21, 0.85)"
          : ringColor;
      g.lineWidth = 2.5;
      g.stroke();
    }

    // Kapal miring sesuai arah gerak (🌌 VIP Mode: roket Aurora)
    if (vipMode) {
      const glow = g.createRadialGradient(
        ship.x,
        ship.y,
        2,
        ship.x,
        ship.y,
        36,
      );
      glow.addColorStop(0, "rgba(52, 211, 153, 0.32)");
      glow.addColorStop(1, "rgba(52, 211, 153, 0)");
      g.fillStyle = glow;
      g.beginPath();
      g.arc(ship.x, ship.y, 36, 0, Math.PI * 2);
      g.fill();
    }
    // 💀 Chaos: roket Merah Membara dengan petir di ekor
    if (chaosMode) {
      const glow = g.createRadialGradient(
        ship.x,
        ship.y,
        2,
        ship.x,
        ship.y,
        38,
      );
      glow.addColorStop(0, "rgba(239, 68, 68, 0.42)");
      glow.addColorStop(1, "rgba(239, 68, 68, 0)");
      g.fillStyle = glow;
      g.beginPath();
      g.arc(ship.x, ship.y, 38, 0, Math.PI * 2);
      g.fill();

      g.save();
      g.strokeStyle = "rgba(252, 165, 165, 0.9)";
      g.lineWidth = 2;
      g.shadowColor = "rgba(239, 68, 68, 0.9)";
      g.shadowBlur = 10;
      for (let k = 0; k < 2; k++) {
        g.beginPath();
        let lx = ship.x + (k ? 7 : -7);
        let ly = ship.y + 15;
        g.moveTo(lx, ly);
        for (let s = 0; s < 3; s++) {
          lx += (Math.random() - 0.5) * 15;
          ly += 9 + Math.random() * 7;
          g.lineTo(lx, ly);
        }
        g.stroke();
      }
      g.restore();
    }
    drawEmoji("🚀", ship.x, ship.y, ship.r * 2.3, ship.vx * 0.045 - 0.78);
    if (vipMode) {
      drawEmoji("✨", ship.x + 9, ship.y + 10, 12); // lencana edisi Aurora
    }
    if (chaosMode) {
      drawEmoji("🔥", ship.x + 9, ship.y + 12, 12); // ekor api sang rival
    }

    // Indikator efek aktif (kiri atas kanvas)
    const fx = [];
    if (boostFrames > 0) fx.push(`⚡ JS Boost ${Math.ceil(boostFrames / 60)}s`);
    if (slowFrames > 0) fx.push(`🐍 Slow-Mo ${Math.ceil(slowFrames / 60)}s`);
    if (shieldCount > 0) fx.push(`🛡️ Shield x${shieldCount}`);
    if (drone) fx.push(`🛰️ Drone siap ${Math.ceil(droneCooldown / 60)}s`);
    if (chaosMode) fx.push("💀 Protokol Rival AKTIF");
    g.font = "600 13px 'Space Grotesk', sans-serif";
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
  }

  function loop() {
    if (!playing) return;
    update();
    if (playing) {
      draw();
      requestAnimationFrame(loop);
    }
  }

  async function start() {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.classList.add("error");
      nameInput.placeholder = "Isi nama pilotmu dulu! ✋";
      nameInput.focus();
      return;
    }
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
    if (myEntry && window.cosmicDB) window.cosmicDB.submit(myEntry);

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
    animateScore(score);

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

    overlay.classList.toggle("vip-holo", vipMode);
    overlay.classList.toggle("chaos-holo", chaosMode);
    bestEl.textContent = getBest(playerName);
    startBtn.textContent = vipMode
      ? "Terbang Lagi 🌟"
      : chaosMode
        ? "Coba Lagi (Biar Enggak Malu) 😏"
        : "Main Lagi 🔁";
    overlay.classList.remove("hidden");
    renderBoard(playerName);
    draw();
  }

  startBtn.addEventListener("click", start);

  // Input nama: Enter = mulai, ketikan tidak bocor ke kontrol game
  nameInput.addEventListener("input", () =>
    nameInput.classList.remove("error"),
  );
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

  // Sentuh / geser di HP dan drag mouse
  function pointerMove(clientX) {
    const rect = cv.getBoundingClientRect();
    ship.x = Math.max(
      ship.r,
      Math.min(W - ship.r, ((clientX - rect.left) / rect.width) * W),
    );
  }
  cv.addEventListener(
    "touchmove",
    (e) => {
      if (!playing) return;
      e.preventDefault();
      pointerMove(e.touches[0].clientX);
    },
    { passive: false },
  );
  cv.addEventListener("mousemove", (e) => {
    if (playing && window.matchMedia("(pointer: fine)").matches) {
      pointerMove(e.clientX);
    }
  });

  // ---- Peraturan game (tombol ? di HUD) ----
  const rulesEl = document.getElementById("game-rules");
  const helpBtn = document.getElementById("game-help");
  let pausedByRules = false;

  function openRules() {
    if (playing) {
      playing = false; // jeda dulu, lanjut setelah peraturan ditutup
      pausedByRules = true;
    }
    rulesEl.classList.remove("hidden");
  }
  function closeRules() {
    rulesEl.classList.add("hidden");
    if (pausedByRules) {
      pausedByRules = false;
      playing = true;
      requestAnimationFrame(loop);
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

  // Gambar kondisi awal di belakang overlay
  makeBgDots();
  draw();
  renderBoard(playerName);
  if (playerName) {
    playerEl.textContent = playerName;
    bestEl.textContent = getBest(playerName);
  }
})();

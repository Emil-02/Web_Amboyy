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
  // Jadwalkan shooting star berikutnya (2–7 detik); tak menumpuk saat dijeda
  setTimeout(spawnShootingStar, Math.random() * 5000 + 2000);
  if (!starfieldRunning) shootingStars = [];
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

  if (starfieldRunning) requestAnimationFrame(drawStars);
}

// Starfield dijeda saat game berjalan (CPU/GPU fokus ke game) dan bila
// pengguna memilih "kurangi animasi" — bintang tetap tergambar statis.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let starfieldRunning = !reduceMotion.matches;
function setStarfield(run) {
  if (run === starfieldRunning) return;
  starfieldRunning = run;
  if (run) requestAnimationFrame(drawStars);
}
window.addEventListener("astro:playing", (e) =>
  setStarfield(!e.detail && !reduceMotion.matches),
);

window.addEventListener("resize", () => {
  resizeCanvas();
  if (!starfieldRunning) drawStars(0);
});
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

// ===== 4. Angka statistik naik =====
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

// ===== 5. Navbar: efek scroll + link aktif =====
const navbar = document.getElementById("navbar");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id], header[id]");
const backToTop = document.getElementById("back-to-top");

// Dibatasi sekali per frame agar scroll di HP tetap mulus
let scrollQueued = false;
function onScroll() {
  scrollQueued = false;
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
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);

backToTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);

// ===== 6. Menu hamburger (mobile) =====
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

// ===== 7. Parallax planet mengikuti kursor =====
const heroVisual = document.getElementById("hero-visual");
if (heroVisual && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * -24;
    const y = (e.clientY / window.innerHeight - 0.5) * -24;
    heroVisual.style.transform = `translate(${x}px, ${y}px)`;
  });
}

// ===== 8. Form kontak: kirim lewat WhatsApp / Email =====
// Pesan dirangkai otomatis lalu dibuka di WhatsApp atau aplikasi email
// pengunjung — tidak ada lagi pesan "terkirim" palsu. Bila kode Formspree
// diisi di js/config.js, tombol Email langsung mengirim tanpa membuka aplikasi.
const contactCfg = (window.SITE_CONFIG || {}).contact || {};
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

function setFormStatus(text, isError = false) {
  formStatus.textContent = text;
  formStatus.classList.toggle("error", isError);
}

async function sendViaFormspree(nama, email, pesan) {
  const buttons = form.querySelectorAll("button[type=submit]");
  buttons.forEach((b) => (b.disabled = true));
  setFormStatus("📡 Mengirim sinyal...");
  try {
    const res = await fetch(`https://formspree.io/f/${contactCfg.formspreeCode}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        _subject: "🚀 Pesan baru dari portofolio!",
        nama,
        email,
        pesan,
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    setFormStatus("🛰️ Sinyal diterima! Aku akan segera membalas pesanmu.");
    form.reset();
  } catch {
    setFormStatus(
      "☄️ Gagal mengirim — coba tombol WhatsApp atau email langsung, ya.",
      true,
    );
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const channel = (e.submitter && e.submitter.value) || "wa";
  const nama = form.elements.nama.value.trim();
  const email = form.elements.email.value.trim();
  const pesan = form.elements.pesan.value.trim();

  if (!nama || !pesan) {
    setFormStatus("✍️ Isi nama dan pesanmu dulu, ya.", true);
    (nama ? form.elements.pesan : form.elements.nama).focus();
    return;
  }
  if (email && !form.elements.email.checkValidity()) {
    setFormStatus("📧 Format email belum benar.", true);
    form.elements.email.focus();
    return;
  }

  if (channel === "email" && contactCfg.formspreeCode) {
    sendViaFormspree(nama, email, pesan);
    return;
  }

  const body =
    `Halo Amboyy! 👋\n\nNama: ${nama}` +
    (email ? `\nEmail: ${email}` : "") +
    `\n\n${pesan}\n\n— dikirim dari portofolio`;

  if (channel === "email") {
    const subject = `🚀 Pesan dari portofolio — ${nama}`;
    window.location.href =
      `mailto:${contactCfg.email}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    setFormStatus("✉️ Aplikasi email terbuka — tinggal tekan Kirim.");
  } else {
    window.open(
      `https://wa.me/${contactCfg.whatsapp}?text=${encodeURIComponent(body)}`,
      "_blank",
      "noopener",
    );
    setFormStatus("💬 WhatsApp terbuka — tinggal tekan Kirim.");
  }
});

// ===== 9. Tahun otomatis di footer =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== 10. Filter & detail proyek =====
(() => {
  const grid = document.getElementById("projects-grid");
  const filter = document.getElementById("project-filter");
  const dialog = document.getElementById("project-dialog");
  const content = document.getElementById("pd-content");
  if (!grid) return;
  const cards = [...grid.querySelectorAll(".project-card")];

  filter?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    const f = btn.dataset.filter;
    filter.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    cards.forEach((card) => {
      const show =
        f === "all" || (card.dataset.category || "").split(" ").includes(f);
      card.hidden = !show;
      if (show) {
        card.classList.add("visible");
        card.classList.remove("filter-in");
        void card.offsetWidth; // mulai ulang animasi masuk
        card.classList.add("filter-in");
      }
    });
  });

  if (!dialog || !content) return;
  grid.addEventListener("click", (e) => {
    const more = e.target.closest(".project-more");
    if (!more) return;
    const card = more.closest(".project-card");
    const title = document.createElement("h3");
    title.id = "pd-title";
    title.textContent = card.querySelector("h3").textContent;
    const tags = card.querySelector(".project-tags").cloneNode(true);
    const detail = card.querySelector(".project-detail").cloneNode(true);
    detail.hidden = false;
    const links = card.querySelector(".project-links").cloneNode(true);
    links.querySelector(".project-more")?.remove();
    content.replaceChildren(title, tags, detail, links);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });

  const closeDialog = () =>
    typeof dialog.close === "function"
      ? dialog.close()
      : dialog.removeAttribute("open");
  document.getElementById("pd-close")?.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (e) => {
    // klik latar gelap atau tautan di dalam dialog → tutup
    if (e.target === dialog || e.target.closest("a")) closeDialog();
  });
})();

// ===== 11. Game & papan global dimuat saat dibutuhkan =====
// game.js (~60 KB) dan Firebase (~300 KB) tidak ikut membebani pemuatan awal.
(() => {
  const section = document.getElementById("game");
  if (!section) return;
  let loaded = false;
  let io = null;

  function loadGame() {
    if (loaded) return;
    loaded = true;
    io?.disconnect();
    const s = document.createElement("script");
    s.src = "js/game.js?v=6";
    s.onload = () => {
      import(new URL("js/firebase.js?v=6", document.baseURI).href).catch(
        (err) => console.warn("🌐 Papan global tidak dimuat:", err),
      );
    };
    document.body.appendChild(s);
  }

  if (location.hash === "#game" || !("IntersectionObserver" in window)) {
    loadGame();
    return;
  }
  io = new IntersectionObserver(
    (entries) => entries.some((en) => en.isIntersecting) && loadGame(),
    { rootMargin: "900px 0px" },
  );
  io.observe(section);
  window.addEventListener("hashchange", () => {
    if (location.hash === "#game") loadGame();
  });
  section.addEventListener("pointerdown", loadGame, { once: true });
})();

// ===== 12. Analytics opsional (tanpa cookie) =====
(() => {
  const a = (window.SITE_CONFIG || {}).analytics || {};
  if (a.cloudflareToken) {
    const s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.dataset.cfBeacon = JSON.stringify({ token: a.cloudflareToken });
    document.head.appendChild(s);
  }
  if (a.goatcounterCode) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${a.goatcounterCode}.goatcounter.com/count`;
    document.head.appendChild(s);
  }
})();

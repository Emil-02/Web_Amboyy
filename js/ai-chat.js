/* NOVA — API key tidak pernah berada di browser. */
(() => {
  // Isi setelah Worker dideploy, misalnya: https://nova-api.nama.workers.dev
  const API_URL = "https://nova-portfolio-ai.dcin5344.workers.dev";
  const panel = document.getElementById("ai-panel"), launcher = document.getElementById("ai-launcher"), close = document.getElementById("ai-close"), form = document.getElementById("ai-form"), input = document.getElementById("ai-input"), messages = document.getElementById("ai-messages"), suggestions = document.getElementById("ai-suggestions");
  const history = [];
  function setOpen(open) { panel.classList.toggle("open", open); panel.setAttribute("aria-hidden", String(!open)); launcher.setAttribute("aria-expanded", String(open)); if (open) input.focus(); }
  function addMessage(text, role, extra = "") { const item = document.createElement("article"); item.className = `ai-message ai-${role} ${extra}`; item.textContent = text; messages.appendChild(item); messages.scrollTop = messages.scrollHeight; return item; }
  async function send(text) {
    const message = text.trim(); if (!message) return;
    addMessage(message, "user"); history.push({ role: "user", content: message }); input.value = "";
    const pending = addMessage("NOVA sedang merangkai jawaban", "bot", "ai-typing");
    try {
      if (!API_URL) throw new Error("not-configured");
      const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-8) }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "request-failed");
      pending.remove(); const reply = data.reply || "Maaf, aku belum menemukan jawaban untuk itu."; addMessage(reply, "bot"); history.push({ role: "assistant", content: reply });
    } catch (error) { pending.remove(); addMessage(error.message === "not-configured" ? "NOVA belum terhubung ke server AI. Pemilik situs perlu mengisi URL Cloudflare Worker di js/ai-chat.js." : "Sinyal ke NOVA sedang terganggu. Coba lagi sebentar, ya.", "bot"); }
  }
  launcher.addEventListener("click", () => setOpen(!panel.classList.contains("open"))); close.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", (event) => { event.preventDefault(); send(input.value); });
  suggestions.addEventListener("click", (event) => { const button = event.target.closest("button"); if (button) send(button.textContent); });
})();

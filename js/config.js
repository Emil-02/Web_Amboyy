/* ============================================================
   Konfigurasi situs — ubah di sini, tidak perlu menyentuh kode lain.
   ============================================================ */
window.SITE_CONFIG = {
  siteUrl: "https://emil-02.github.io/Web_Amboyy/",

  contact: {
    email: "emilrahmat866@gmail.com",
    // Format internasional tanpa "+" / spasi (dipakai wa.me)
    whatsapp: "6281354997148",
    instagram: "amboyybuild",
    // Opsional: isi 8 karakter kode form Formspree (formspree.io/f/XXXXXXXX)
    // agar tombol "Kirim via Email" langsung terkirim tanpa membuka aplikasi email.
    formspreeCode: "",
  },

  // NOVA dicoba berurutan. Domain *.workers.dev diblokir sebagian ISP di
  // Indonesia — tambahkan custom domain Worker di urutan PERTAMA bila sudah ada,
  // misalnya "https://nova.amboyy.my.id".
  novaEndpoints: ["https://nova-portfolio-ai.dcin5344.workers.dev"],
  novaTimeoutMs: 6000,

  // Analytics tanpa cookie (opsional). Isi salah satu:
  // - Cloudflare Web Analytics: token dari dash.cloudflare.com → Web Analytics
  // - GoatCounter: kode situs, mis. "amboyy" untuk https://amboyy.goatcounter.com
  analytics: {
    cloudflareToken: "",
    goatcounterCode: "",
  },
};

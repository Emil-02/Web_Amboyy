/* ============================================================
   Papan Peringkat Global — Firebase Firestore
   Sinkron live antar semua pengunjung website.

   Keamanan:
   - Config web Firebase memang publik; data dijaga Security Rules
     (lihat firestore.rules di root repo — wajib di-deploy).
   - Setiap browser masuk sebagai pengguna anonim (Firebase Anonymous Auth).
     Nama pilot terikat ke UID pertama yang memakainya, jadi orang lain
     tidak bisa menimpa skor/nama milikmu.
   - Waktu mulai permainan dicatat dengan jam server (sessions/{uid});
     rules menolak skor yang mustahil dicapai dalam durasi itu.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtbiHqG9k4U5VK76oTylf3xUWquSp1Ikg",
  authDomain: "project-127af9c3-525d-4fc3-934.firebaseapp.com",
  projectId: "project-127af9c3-525d-4fc3-934",
  storageBucket: "project-127af9c3-525d-4fc3-934.firebasestorage.app",
  messagingSenderId: "194826626838",
  appId: "1:194826626838:web:be8791cdfaa078a6bb9237",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const api = { uid: null, submit, startSession };
window.cosmicDB = api;

// Anonymous Auth harus diaktifkan di Firebase Console → Authentication.
// Bila belum, papan tetap bisa dibaca dan skor dikirim tanpa UID.
const ready = signInAnonymously(auth)
  .then((cred) => {
    api.uid = cred.user.uid;
    if (lastSnap) publish(lastSnap); // hitung ulang kepemilikan nama
  })
  .catch((err) => {
    console.warn("🌐 Login anonim gagal:", err.code || err.message);
  });

// ===== Sinkronisasi live: setiap perubahan papan dikirim ke game =====
let lastSnap = null;
function publish(snap) {
  lastSnap = snap;
  const board = snap.docs.map((d) => {
    const v = d.data();
    return {
      name: String(v.name || "").slice(0, 14),
      score: Number(v.score) || 0,
      badges: Array.isArray(v.badges) ? v.badges : [],
      owned: Boolean(v.uid),
      mine: Boolean(api.uid && v.uid === api.uid),
    };
  });
  window.cosmicBoard = board;
  window.dispatchEvent(new CustomEvent("cosmic:board", { detail: board }));
}

onSnapshot(
  query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(100)),
  publish,
  (err) => {
    console.warn("🌐 Papan global tidak tersedia:", err.code || err.message);
  },
);

// ===== Catat waktu mulai (jam server) untuk validasi skor =====
async function startSession() {
  await ready;
  if (!api.uid) return;
  try {
    await setDoc(doc(db, "sessions", api.uid), { startedAt: serverTimestamp() });
  } catch (e) {
    console.warn("🌐 Sesi tidak tercatat:", e.code || e.message);
  }
}

// ===== Kirim skor: transaksi agar skor terbaik & lencana tak saling timpa =====
async function submit(entry) {
  if (!entry || !entry.name) return { ok: false, reason: "invalid" };
  await ready;
  const ref = doc(db, "leaderboard", entry.name.toLowerCase());
  try {
    await runTransaction(db, async (tx) => {
      const cur = await tx.get(ref);
      const old = cur.exists() ? cur.data() : { score: -1, badges: [] };
      if (api.uid && old.uid && old.uid !== api.uid) {
        throw Object.assign(new Error("name-taken"), { code: "name-taken" });
      }
      // Nama lama tanpa pemilik hanya bisa diklaim dengan memecahkan skornya
      if (api.uid && cur.exists() && !old.uid && entry.score <= old.score) {
        throw Object.assign(new Error("claim"), { code: "claim-needed" });
      }
      const data = {
        name: entry.name,
        score: Math.max(
          Math.floor(Number(entry.score) || 0),
          Number(old.score) || 0,
        ),
        badges: [...new Set([...(old.badges || []), ...(entry.badges || [])])],
        updatedAt: serverTimestamp(),
      };
      if (api.uid) data.uid = api.uid;
      tx.set(ref, data);
    });
    return { ok: true };
  } catch (e) {
    if (e.code === "name-taken") return { ok: false, reason: "name-taken" };
    if (e.code === "claim-needed") return { ok: false, reason: "claim-needed" };
    console.warn("🌐 Gagal mengirim skor global:", e.code || e.message);
    return {
      ok: false,
      reason: e.code === "permission-denied" ? "rejected" : "offline",
    };
  }
}

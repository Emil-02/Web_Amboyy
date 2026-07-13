/* ============================================================
   Papan Peringkat Global — Firebase Firestore
   Sinkron live antar semua pengunjung website.
   Catatan: config web Firebase memang publik — keamanan data
   dijaga oleh Security Rules di Firebase Console.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
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

// ===== Sinkronisasi live: setiap perubahan papan dikirim ke game =====
const boardQuery = query(
  collection(db, "leaderboard"),
  orderBy("score", "desc"),
  limit(100),
);

onSnapshot(
  boardQuery,
  (snap) => {
    const board = snap.docs.map((d) => {
      const v = d.data();
      return {
        name: String(v.name || "").slice(0, 14),
        score: Number(v.score) || 0,
        badges: Array.isArray(v.badges) ? v.badges : [],
      };
    });
    window.dispatchEvent(new CustomEvent("cosmic:board", { detail: board }));
  },
  (err) => {
    console.warn("🌐 Papan global tidak tersedia:", err.code || err.message);
  },
);

// ===== Kirim skor: transaksi agar skor terbaik & lencana tak saling timpa =====
async function submit(entry) {
  if (!entry || !entry.name) return;
  const ref = doc(db, "leaderboard", entry.name.toLowerCase());
  try {
    await runTransaction(db, async (tx) => {
      const cur = await tx.get(ref);
      const old = cur.exists() ? cur.data() : { score: -1, badges: [] };
      tx.set(ref, {
        name: entry.name,
        score: Math.max(Number(entry.score) || 0, Number(old.score) || 0),
        badges: [...new Set([...(old.badges || []), ...(entry.badges || [])])],
        updatedAt: serverTimestamp(),
      });
    });
  } catch (e) {
    console.warn("🌐 Gagal mengirim skor global:", e.code || e.message);
  }
}

window.cosmicDB = { submit };

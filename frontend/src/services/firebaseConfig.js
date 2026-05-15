import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Pastikan variabel .env kamu sudah benar
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// EXPORT NAMED: Ini yang dicari oleh CustomerTracking.jsx
export const database = getDatabase(app);

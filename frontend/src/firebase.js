import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // <--- 1. Import Auth

const firebaseConfig = {
  apiKey: "AIzaSyBIsmnPx6yOsLeM-Las_9g03X4dUJHdT6Y",
  authDomain: "food-del-e9de4.firebaseapp.com",
  projectId: "food-del-e9de4",
  storageBucket: "food-del-e9de4.firebasestorage.app",
  messagingSenderId: "298528508272",
  appId: "1:298528508272:web:38c0f4fe6fdad4ce8ee7b5",
  measurementId: "G-TGFXDNY69Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// --- 2. EXPORT AUTH (CRITICAL) ---
export const auth = getAuth(app); 
export default app;
// ============================================
// Firebase Configuration & Initialization
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyB3rcju2a9GCTCPSVbdf7d6wss58lT0WZI",
  authDomain: "tawzi3-2025.firebaseapp.com",
  projectId: "tawzi3-2025",
  storageBucket: "tawzi3-2025.firebasestorage.app",
  messagingSenderId: "72495718171",
  appId: "1:72495718171:web:9936ba05e84a165d157dbe",
  measurementId: "G-QV2FF4YRFD",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================
// SHA-256 Hashing Utility (Web Crypto API)
// ============================================

/**
 * Hash a string using SHA-256
 * @param {string} message - The plain text to hash
 * @returns {Promise<string>} - Hex-encoded hash string
 */
async function hashPassword(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

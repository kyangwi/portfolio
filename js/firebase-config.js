// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8tOhJWFIC87xbvgEGPtYPbfWqdYEwL9A",
  authDomain: "portfolio-5ec3c.firebaseapp.com",
  projectId: "portfolio-5ec3c",
  storageBucket: "portfolio-5ec3c.firebasestorage.app",
  messagingSenderId: "317183609866",
  appId: "1:317183609866:web:ed3166951ed2a0f67a63f3",
  measurementId: "G-03GVXHM49D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Analytics unavailable in this environment:", error?.message || error);
}
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };

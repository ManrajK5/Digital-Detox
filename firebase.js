
// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCOsv4UA30GbU9bNZKAEKezf1d0PlK_eQA",
  authDomain: "digital-detox-c2afe.firebaseapp.com",
  projectId: "digital-detox-c2afe",
  storageBucket: "digital-detox-c2afe.firebasestorage.app",
  messagingSenderId: "786573691869",
  appId: "1:786573691869:web:608aa7874fe3b29bd3c434",
  measurementId: "G-2ZVTVSVNDR"
};
  
  // Import from Firebase CDN
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
  import {
    getFirestore,
    doc,
    setDoc
  } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
  
  const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export { doc, setDoc };
  
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIJU-d_089-5LvDdLN-5W-KHgIeXr254E",
  authDomain: "transceed-meet-fd843.firebaseapp.com",
  projectId: "transceed-meet-fd843",
  storageBucket: "transceed-meet-fd843.appspot.com",  // FIXED: Corrected storage bucket
  messagingSenderId: "927339188064",
  appId: "1:927339188064:web:73d8c9c843da15112f9805",
  measurementId: "G-TGKKF34QF9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, onAuthStateChanged };

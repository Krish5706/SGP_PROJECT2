import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDIJU-d_089-5LvDdLN-5W-KHgIeXr254E",
  authDomain: "transceed-meet-fd843.firebaseapp.com",
  projectId: "transceed-meet-fd843",
  storageBucket: "transceed-meet-fd843.appspot.com",
  messagingSenderId: "927339188064",
  appId: "1:927339188064:web:73d8c9c843da15112f9805",
  measurementId: "G-TGKKF34QF9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Fetch User Profile from Firestore
async function fetchUserProfile(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Handle Authentication State Changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userProfile = await fetchUserProfile(user.uid);
    // Dispatch a custom event with user data
    document.dispatchEvent(new CustomEvent("userAuthenticated", { detail: { user, userProfile } }));
  } else {
    document.dispatchEvent(new CustomEvent("userLoggedOut"));
  }
});

export { auth, db, signOut, fetchUserProfile };
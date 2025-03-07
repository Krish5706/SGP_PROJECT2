// // Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDIJU-d_089-5LvDdLN-5W-KHgIeXr254E",
//   authDomain: "transceed-meet-fd843.firebaseapp.com",
//   projectId: "transceed-meet-fd843",
//   databaseURL: "https://transceed-meet-fd843-default-rtdb.firebaseio.com",
//   storageBucket: "transceed-meet-fd843.appspot.com",
//   messagingSenderId: "927339188064",
//   appId: "1:927339188064:web:73d8c9c843da15112f9805",
//   measurementId: "G-TGKKF34QF9"
// };

// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// const db = firebase.database();

// // Initialize WebRTC adapter for browser compatibility
// if (typeof adapter !== 'undefined') {
//   adapter.browserShim();
// }

// console.log("Firebase initialized successfully");




import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to fetch profile data
async function fetchProfile(userId) {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        console.log("Profile Data:", snapshot.val());
        return snapshot.val();
    } else {
        console.log("No such user!");
        return null;
    }
}

// Example usage
fetchProfile("user123");

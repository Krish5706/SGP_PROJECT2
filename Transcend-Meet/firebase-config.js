// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIJU-d_089-5LvDdLN-5W-KHgIeXr254E",
  authDomain: "transceed-meet-fd843.firebaseapp.com",
  projectId: "transceed-meet-fd843",
  databaseURL: "https://transceed-meet-fd843-default-rtdb.asia-southeast1.firebasedatabase.app/",
  storageBucket: "transceed-meet-fd843.appspot.com",
  messagingSenderId: "927339188064",
  appId: "1:927339188064:web:73d8c9c843da15112f9805",
  measurementId: "G-TGKKF34QF9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Initialize WebRTC adapter for browser compatibility
if (typeof adapter !== 'undefined') {
  adapter.browserShim();
}

console.log("Firebase initialized successfully");
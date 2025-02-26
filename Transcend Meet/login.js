// app.js

// Firebase Configuration 
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js';

// Firebase initialization
const firebaseConfig = {
    apiKey: "AIzaSyDIJU-d_089-5LvDdLN-5W-KHgIeXr254E",
    authDomain: "transceed-meet-fd843.firebaseapp.com",
    projectId: "transceed-meet-fd843",
    storageBucket: "transceed-meet-fd843.firebasestorage.app",
    messagingSenderId: "927339188064",
    appId: "1:927339188064:web:73d8c9c843da15112f9805",
    measurementId: "G-TGKKF34QF9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle Registration
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User created, now updating profile with name:", username);
        
        // Update Auth profile
        await updateProfile(user, { displayName: username });

        // Update Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: username,
            email: email,
            createdAt: serverTimestamp()
        });

        console.log("Profile updated successfully. Name:", username);
        alert('Registration successful!');
        
        // Wait for auth state change before redirecting
        await new Promise(resolve => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });

        window.location.href = "./main.html";
    } catch (error) {
        console.error("Registration failed:", error);
        alert(`Registration failed: ${error.message}`);
    }
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User Logged In:', userCredential.user);
        window.location.href = "./main.html"; // Redirect to main.html
    } catch (error) {
        alert(`Login failed: ${error.message}`);
    }
});

// Handle Forgot Password
document.querySelector('.forgot-link a').addEventListener('click', (e) => {
    e.preventDefault();
    const email = prompt('Please enter your registered email address:');
    if (email) {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert('Password reset email sent! Check your inbox.');
            })
            .catch((error) => {
                alert(`Failed to send reset email: ${error.message}`);
            });
    } else {
        alert('Email address is required to reset your password.');
    }
});

// DOM Elements for Toggle
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// Toggle Forms
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

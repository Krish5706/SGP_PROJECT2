// Firebase Configuration 
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
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const auth = firebase.auth();
const db = firebase.firestore(); // Initialize Firestore

// Handle Registration
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    // First create the user with email and password
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User created, now updating profile with name:", username);
            
            // Create a promise for updating the Auth profile
            const updateAuthProfile = user.updateProfile({
                displayName: username
            }).catch(error => {
                console.error("Error updating Auth profile:", error);
                // Still continue even if this fails
            });
            
            // Create a promise for updating Firestore
            const updateFirestore = db.collection("users").doc(user.uid).set({
                name: username,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(error => {
                console.error("Error saving to Firestore:", error);
                // Still continue even if this fails
            });
            
            // Wait for both operations to complete
            return Promise.all([updateAuthProfile, updateFirestore])
                .then(() => {
                    console.log("Profile updated successfully. Name:", username);
                    alert('Registration successful!');
                    // Force a reload of the auth state before redirecting
                    return new Promise(resolve => {
                        const unsubscribe = auth.onAuthStateChanged(user => {
                            unsubscribe();
                            resolve(user);
                        });
                    });
                })
                .then(() => {
                    window.location.href = "./main.html";
                });
        })
        .catch((error) => {
            console.error("Registration failed:", error);
            alert(`Registration failed: ${error.message}`);
        });
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User Logged In:', userCredential.user);
            window.location.href = "./main.html"; // Redirect to main.html
        })
        .catch((error) => {
            alert(`Login failed: ${error.message}`);
        });
});

// Handle Forgot Password
document.querySelector('.forgot-link a').addEventListener('click', (e) => {
    e.preventDefault();
    const email = prompt('Please enter your registered email address:');
    if (email) {
        auth.sendPasswordResetEmail(email)
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
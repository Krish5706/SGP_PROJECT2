// // Firebase Configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyBe0sg0snJDVjldfjG5fZX_kCibDNyDkwA",
//     authDomain: "transceed-meet.firebaseapp.com",
//     projectId: "transceed-meet",
//     storageBucket: "transceed-meet.firebasestorage.app",
//     messagingSenderId: "842320819809",
//     appId: "1:842320819809:web:b8eab84607741451c4dc20",
//     measurementId: "G-BHCFMTVV8S"
// };

// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// firebase.analytics();
// const auth = firebase.auth();

// // Handle Registration
// document.getElementById('register-form').addEventListener('submit', (e) => {
//     e.preventDefault();
//     const email = e.target.querySelector('input[placeholder="Email"]').value;
//     const password = e.target.querySelector('input[placeholder="Password"]').value;

//     auth.createUserWithEmailAndPassword(email, password)
//         .then((userCredential) => {
//             alert('Registration successful!');
//             console.log('User Registered:', userCredential.user);
//         })
//         .catch((error) => {
//             alert(`Registration failed: ${error.message}`);
//         });
// });

// // Handle Login
// document.getElementById('login-form').addEventListener('submit', (e) => {
//     e.preventDefault();
//     const email = e.target.querySelector('input[placeholder="Email"]').value;
//     const password = e.target.querySelector('input[placeholder="Password"]').value;

//     auth.signInWithEmailAndPassword(email, password)
//         .then((userCredential) => {
//             alert('Login successful!');
//             window.location.href = "./Transceed Meet/home.html"; // Redirect to home.html (relative path)
//             console.log('User Logged In:', userCredential.user);
//         })
//         .catch((error) => {
//             alert(`Login failed: ${error.message}`);
//         });
// });

// // DOM Elements
// const container = document.querySelector('.container');
// const registerBtn = document.querySelector('.register-btn');
// const loginBtn = document.querySelector('.login-btn');
// const loginForm = document.getElementById('login-form');
// const registerForm = document.getElementById('register-form');

// // Toggle Forms
// registerBtn.addEventListener('click', () => {
//     container.classList.add('active');
// });

// loginBtn.addEventListener('click', () => {
//     container.classList.remove('active');
// });


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

// Handle Registration
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[placeholder="Email"]').value;
    const password = e.target.querySelector('input[placeholder="Password"]').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Registration successful!');
            console.log('User Registered:', userCredential.user);
        })
        .catch((error) => {
            alert(`Registration failed: ${error.message}`);
        });
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[placeholder="Email"]').value;
    const password = e.target.querySelector('input[placeholder="Password"]').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Login successful!');
            console.log('User Logged In:', userCredential.user);
            window.location.href = "./home.html"; // Redirect to home.html
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

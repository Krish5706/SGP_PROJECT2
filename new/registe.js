import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyTtbLBGSSbFvnRwq6yGWFeq86xNfshyc",
  authDomain: "transceed-9bec1.firebaseapp.com",
  projectId: "transceed-9bec1",
  storageBucket: "transceed-9bec1.firebasestorage.app",
  messagingSenderId: "1043316176228",
  appId: "1:1043316176228:web:6dae996593b07e1d62f671"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Password validation function
function validatePassword(password) {
    const strongPasswordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return strongPasswordPattern.test(password);
}

// Registration event listener
document.getElementById('register-submit').addEventListener('click', function(event) {
    event.preventDefault();
    const registerButton = event.target;
    registerButton.disabled = true;
    registerButton.textContent = 'Registering...';
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!validatePassword(password)) {
        alert('Password must be at least 8 characters long and include a mix of uppercase, lowercase, and numbers.');
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert('Registration successful! Welcome, ' + user.email);
            window.location.href = '/dashboard.html'; // Redirect to the dashboard
        })
        .catch((error) => {
            let errorMessage;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already in use.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred.';
            }
            alert(errorMessage);
        })
        .finally(() => {
            registerButton.disabled = false;
            registerButton.textContent = 'Register';
        });
});

// Login event listener
document.getElementById('login-submit').addEventListener('click', function(event) {
    event.preventDefault();
    const loginButton = event.target;
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert('Login successful! Welcome back, ' + user.email);
            window.location.href = '/dashboard.html'; // Redirect to the dashboard
        })
        .catch((error) => {
            let errorMessage;
            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No user found with this email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred.';
            }
            alert(errorMessage);
        })
        .finally(() => {
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        });
});

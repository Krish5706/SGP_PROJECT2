// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBe0sg0snJDVjldfjG5fZX_kCibDNyDkwA",
  authDomain: "transceed-meet.firebaseapp.com",
  projectId: "transceed-meet",
  storageBucket: "transceed-meet.firebasestorage.app",
  messagingSenderId: "842320819809",
  appId: "1:842320819809:web:b8eab84607741451c4dc20",
  measurementId: "G-BHCFMTVV8S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

// Registration function
async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    alert('Registration successful!');
    console.log('User registered:', userCredential.user);
  } catch (error) {
    alert(error.message);
    console.error(error.code, error.message);
  }
}

// Login function
// Login function
async function loginUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
      console.log('User logged in:', userCredential.user);
  
      // Redirect to home.html after successful login
      window.location.href = 'home.html';
    } catch (error) {
      alert(error.message);
      console.error(error.code, error.message);
    }
  }
  
// Attach event listeners dynamically
export function attachEventListeners() {
  const loginForm = document.querySelector('.form-box.login form');
  const registerForm = document.querySelector('.form-box.register form');

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = loginForm.querySelector('input[type="text"]').value; // Username placeholder used for email
    const password = loginForm.querySelector('input[type="password"]').value;
    loginUser(email, password);
  });

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;
    registerUser(email, password);
  });
}

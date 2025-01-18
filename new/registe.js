 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
 // TODO: Add SDKs for Firebase products that you want to use
 // https://firebase.google.com/docs/web/setup#available-libraries

 // Your web app's Firebase configuration
 const firebaseConfig = {
   apiKey: "AIzaSyBneVLuNWOKx1yCvBfwmCa2fOgb3u8x_Gw",
   authDomain: "login-da8e3.firebaseapp.com",
   projectId: "login-da8e3",
   storageBucket: "login-da8e3.firebasestorage.app",
   messagingSenderId: "652107680792",
   appId: "1:652107680792:web:14878df33165f6789cc76d"
 };

 // Initialize Firebase
 const app = initializeApp(firebaseConfig);

 const email=document.getElementById('email').value;
 const password = document.getElementById('password').value;

 const submit = document.getElementById('submit').value;

 submit.addEventListener("click",function(event){
    event.preventDefault()
    alert(5)
 })
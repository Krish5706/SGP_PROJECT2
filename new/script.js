import { attachEventListeners } from './firebase.js';

const container = document.querySelector('.container');
const registerbtn = document.querySelector('.register-btn');
const loginbtn = document.querySelector('.login-btn');

// Toggle between login and registration forms
registerbtn.addEventListener('click', () => {
  container.classList.add('active');
});

loginbtn.addEventListener('click', () => {
  container.classList.remove('active');
});

// Attach Firebase event listeners
attachEventListeners();

// Global variables for Firebase (assuming Firebase is already loaded via CDN)
let auth, db;

// Initialize Firebase when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase (assuming Firebase CDN scripts are included)
    const firebaseConfig = {
        apiKey: "AIzaSyDIJU-d_089-5LvDdLN-5W-KHgIeXr254E",
        authDomain: "transceed-meet-fd843.firebaseapp.com",
        databaseURL: "https://transceed-meet-fd843-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "transceed-meet-fd843",
        storageBucket: "transceed-meet-fd843.firebasestorage.app",
        messagingSenderId: "927339188064",
        appId: "1:927339188064:web:73d8c9c843da15112f9805",
        measurementId: "G-TGKKF34QF9"
      };
    
    // Check if Firebase is loaded
    if (typeof firebase !== 'undefined') {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Check authentication state
        auth.onAuthStateChanged(function(user) {
            setupProfileButton(user);
        });
    } else {
        console.error("Firebase is not loaded. Make sure to include the Firebase CDN scripts.");
    }
    
    // Initial time update
    updateTime();
});

// Setup Profile Button based on auth state
function setupProfileButton(user) {
    const profileButton = document.querySelector('.nav-button');
    if (user) {
        profileButton.textContent = user.displayName || user.email.split('@')[0] || 'Profile';
    } else {
        profileButton.textContent = 'Guest Profile';
    }
}

// Profile Box Toggle with User Data
function toggleProfileBox() {
    const profileBox = document.getElementById("profile-box");
    profileBox.classList.toggle("hidden");
    
    // If the profile box is now visible, populate it with user data
    if (!profileBox.classList.contains("hidden")) {
        populateProfileBox();
    }
}

// Populate Profile Box with User Data
function populateProfileBox() {
    const profileBox = document.getElementById("profile-box");
    
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !auth) {
        profileBox.innerHTML = `
            <p>Guest User</p>
            <p>Firebase is not loaded properly.</p>
            <button onclick="toggleProfileBox()">Close</button>
        `;
        return;
    }
    
    const user = auth.currentUser;
    
    if (user) {
        // User is signed in
        let profileHTML = `
            <h3>User Profile</h3>
            <div class="profile-detail">
                <p><strong>Name:</strong> ${user.displayName || 'Not set'}</p>
                <p><strong>Email:</strong> ${user.email}</p>
            </div>
            
            <div class="profile-actions">
                <button onclick="alert('Edit profile coming soon')" class="profile-btn">Edit Profile</button>
                <button onclick="handleLogout()" class="profile-btn logout-btn">Logout</button>
            </div>
            
            <button onclick="toggleProfileBox()" class="close-profile">Close</button>
        `;
        
        // Try to load additional data from Firestore if available
        if (db) {
            db.collection("users").doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        let updatedHTML = `
                            <h3>User Profile</h3>
                            <div class="profile-detail">
                                <p><strong>Name:</strong> ${user.displayName || userData.name || 'Not set'}</p>
                                <p><strong>Email:</strong> ${user.email}</p>
                        `;
                        
                        if (userData.phoneNumber) updatedHTML += `<p><strong>Phone:</strong> ${userData.phoneNumber}</p>`;
                        if (userData.organization) updatedHTML += `<p><strong>Organization:</strong> ${userData.organization}</p>`;
                        
                        updatedHTML += `
                            </div>
                            
                            <div class="profile-actions">
                                <button onclick="alert('Edit profile coming soon')" class="profile-btn">Edit Profile</button>
                                <button onclick="handleLogout()" class="profile-btn logout-btn">Logout</button>
                            </div>
                            
                            <button onclick="toggleProfileBox()" class="close-profile">Close</button>
                        `;
                        
                        profileBox.innerHTML = updatedHTML;
                    } else {
                        profileBox.innerHTML = profileHTML;
                    }
                })
                .catch((error) => {
                    console.error("Error getting user document:", error);
                    profileBox.innerHTML = profileHTML; // Show fallback profile if error fetching from Firestore
                });
        } else {
            profileBox.innerHTML = profileHTML; // Fallback to Firebase Auth data if Firestore isn't available
        }
    } else {
        // User is not signed in - show guest profile
        profileBox.innerHTML = `
            <h3>Guest User</h3>
            <p>You are currently browsing as a guest.</p>
            <div class="profile-actions">
                <button onclick="window.location.href='login.html'" class="profile-btn">Sign In</button>
                <button onclick="window.location.href='signup.html'" class="profile-btn">Create Account</button>
            </div>
            
            <button onclick="toggleProfileBox()" class="close-profile">Close</button>
        `;
    }
}

// Logout Function
function handleLogout() {
    if (typeof firebase === 'undefined' || !auth) {
        alert("Firebase is not loaded properly. Cannot log out.");
        return;
    }
    
    const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
        auth.signOut().then(() => {
            alert("Logged out successfully");
            window.location.href = "login.html";
        }).catch((error) => {
            console.error("Error during logout:", error);
            alert("Error during logout. Please try again.");
        });
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    // Optional: Save preference to localStorage
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
}

// Display Current Time and Date
function updateTime() {
    const timeElement = document.getElementById("current-time");
    const dateElement = document.getElementById("current-date");

    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    timeElement.textContent = now.toLocaleTimeString();
    dateElement.textContent = now.toLocaleDateString(undefined, options);
}

// Update Time Every Second
setInterval(updateTime, 1000);

// Navigation Functions
function navigateHome() {
    window.location.href = "home.html";
}

// Navigate to meeting.html
function startNewMeeting() {
    window.location.href = 'index.html'; 
}

function joinMeeting() {
    const meetingLink = prompt("Enter the meeting link:");
    if (meetingLink) {
        alert(`Joining meeting: ${meetingLink}`);
        window.location.href = meetingLink; // Redirect to meeting link
    }
}

function scheduleMeeting() {
    window.location.href='schedulemeeting.html';   
    
    // Implement scheduling logic here
}

function viewRecordings() {
    alert("Redirecting to meeting recordings...");
    // Implement logic to fetch and display recordings
}

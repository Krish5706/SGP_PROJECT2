// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
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
updateTime();

// Navigation Functions
function navigateHome() {
    window.location.href = "home.html";
}

function startNewMeeting() {
    alert("Starting a new meeting...");
    // Add logic to generate meeting link
}

function joinMeeting() {
    const meetingLink = prompt("Enter the meeting link:");
    if (meetingLink) {
        alert(`Joining meeting: ${meetingLink}`);
        window.location.href = meetingLink; // Redirect to meeting link
    }
}

function scheduleMeeting() {
    alert("Redirecting to schedule meeting page...");
    // Implement scheduling logic here
}

function viewRecordings() {
    alert("Redirecting to meeting recordings...");
    // Implement logic to fetch and display recordings
}

// Logout Function
function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
        alert("Logging out...");
        window.location.href = "login.html"; // Redirect to login page
    }
}

// Ensure Firebase is initialized before using auth
if (firebase && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            updateUserProfile(user);
        }
    });
} else {
    console.error("Firebase is not initialized properly.");
}

// Function to update user profile details
function updateUserProfile(user) {
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");

    if (profileName) profileName.textContent = user.displayName || "No Name";
    if (profileEmail) profileEmail.textContent = user.email || "No Email";
}

// Function to toggle profile visibility
function toggleProfileBox() {
    const profileBox = document.getElementById("profile-box");
    profileBox.classList.toggle("hidden");

    const user = firebase.auth().currentUser;
    
    if (user) {
        // Display user details
        document.getElementById("profile-name").textContent = user.displayName || "No Name Provided";
        document.getElementById("profile-email").textContent = user.email || "No Email Available";
    } else {
        console.error("No user is signed in.");
    }
}

// Listen for authentication state change
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        document.getElementById("profile-name").textContent = user.displayName || "No Name Provided";
        document.getElementById("profile-email").textContent = user.email || "No Email Available";
    }
});

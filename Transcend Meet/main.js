// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

// Profile Box Toggle
function toggleProfileBox() {
    const profileBox = document.getElementById("profile-box");
    profileBox.classList.toggle("hidden");
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

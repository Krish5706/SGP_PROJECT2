// Global variables
let cameraStream = null;
let microphoneStream = null;
let currentUser = {
    id: null,
    name: "Guest"
};

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    const cameraBtn = document.getElementById('cameraBtn');
    const microphoneBtn = document.getElementById('microphoneBtn');
    const startMeetingBtn = document.getElementById('startMeetingBtn');
    const joinMeetingBtn = document.getElementById('joinMeetingBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const enterMeetingBtn = document.getElementById('enterMeetingBtn');
    const joinExistingMeetingBtn = document.getElementById('joinExistingMeetingBtn');
    const userNameInput = document.getElementById('userName');
    
    // Set up event listeners
    if (cameraBtn) cameraBtn.addEventListener('click', toggleCamera);
    if (microphoneBtn) microphoneBtn.addEventListener('click', toggleMicrophone);
    if (startMeetingBtn) startMeetingBtn.addEventListener('click', startMeeting);
    if (joinMeetingBtn) joinMeetingBtn.addEventListener('click', showJoinForm);
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', copyMeetingLink);
    if (enterMeetingBtn) enterMeetingBtn.addEventListener('click', enterMeeting);
    if (joinExistingMeetingBtn) joinExistingMeetingBtn.addEventListener('click', joinExistingMeeting);
    if (userNameInput) userNameInput.addEventListener('input', updateUserName);
    
    // Generate a random user ID if not already set
    if (!sessionStorage.getItem('userID')) {
        sessionStorage.setItem('userID', 'user_' + Math.random().toString(36).substring(2, 10));
    }
    
    currentUser.id = sessionStorage.getItem('userID');
    
    // Set user name from session storage if available
    if (sessionStorage.getItem('userName')) {
        currentUser.name = sessionStorage.getItem('userName');
    } else {
        // Set default name as "Guest"
        currentUser.name = "Guest";
    }
    
    // Check if we're coming from a meeting link
    checkForMeetingLink();
});

// Function to check if the user arrived via a meeting link
function checkForMeetingLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingLink = urlParams.get('link');
    
    if (meetingLink) {
        console.log("Meeting link detected:", meetingLink);
        
        // Check if the user is authenticated
        if (!firebase.auth().currentUser) {
            showAuthForm(meetingLink);
        } else {
            validateAndJoinMeeting(meetingLink);
        }
    }
}

// Show authentication form when the user arrives via link but isn't signed in
function showAuthForm(meetingLink) {
    document.getElementById('mainContent').style.display = 'none';
    
    const authForm = document.createElement('div');
    authForm.className = 'auth-container';
    authForm.innerHTML = `
        <div class="auth-form">
            <h2>Sign in to join the meeting</h2>
            <p>You need to sign in before joining this meeting</p>
            <div class="form-group">
                <input type="text" id="authName" placeholder="Your name" required>
            </div>
            <div class="auth-buttons">
                <button id="guestJoinBtn" class="btn">Join as Guest</button>
                <button id="signInBtn" class="btn primary">Sign In</button>
            </div>
            <p class="small-text">By joining, you agree to our Terms of Service</p>
        </div>
    `;
    
    document.body.appendChild(authForm);
    
    document.getElementById('guestJoinBtn').addEventListener('click', function() {
        const guestName = document.getElementById('authName').value.trim() || "Guest";
        currentUser.name = guestName;
        sessionStorage.setItem('userName', guestName);
        validateAndJoinMeeting(meetingLink);
    });
    
    document.getElementById('signInBtn').addEventListener('click', function() {
        const userName = document.getElementById('authName').value.trim() || "Guest";
        currentUser.name = userName;
        sessionStorage.setItem('userName', userName);
        validateAndJoinMeeting(meetingLink);
    });
}

// Validate meeting link and join if valid
function validateAndJoinMeeting(meetingLink) {
    const decodedLink = decodeURIComponent(meetingLink);
    
    db.ref('meetingLinks').orderByChild('link').equalTo(decodedLink).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                let meetingID = null;
                snapshot.forEach(childSnapshot => {
                    meetingID = childSnapshot.val().meetingID;
                });
                
                if (meetingID) {
                    return db.ref('meetings/' + meetingID).once('value');
                } else {
                    throw new Error("Invalid meeting link structure");
                }
            } else {
                throw new Error("Meeting link not found");
            }
        })
        .then(snapshot => {
            if (snapshot.exists() && snapshot.val().active) {
                const meetingID = snapshot.key;
                return addParticipantToMeeting(meetingID);
            } else {
                throw new Error("Meeting is no longer active");
            }
        })
        .catch(error => {
            console.error("Error validating meeting link:", error);
            alert("Failed to join meeting: " + error.message);
            const authForm = document.querySelector('.auth-container');
            if (authForm) authForm.remove();
            document.getElementById('mainContent').style.display = 'block';
        });
}

// Add participant to the meeting
function addParticipantToMeeting(meetingID) {
    return db.ref('meetings/' + meetingID + '/participants/' + currentUser.id).set({
        name: currentUser.name,
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
        isHost: false,
        hasVideo: !!cameraStream,
        hasAudio: !!microphoneStream,
        isOnline: true
    }).then(() => {
        sessionStorage.setItem('meetingID', meetingID);
        sessionStorage.setItem('isHost', 'false');
        window.location.href = `meetingroom.html?id=${meetingID}`;
    });
}

// Function to update user name
function updateUserName(e) {
    currentUser.name = e.target.value || "Guest";
    sessionStorage.setItem('userName', currentUser.name);
}

// Function to toggle camera
function toggleCamera() {
    const cameraBtn = document.getElementById("cameraBtn");
    const cameraIcon = document.getElementById("cameraIcon");
    
    if (!cameraBtn || !cameraIcon) return;

    if (!cameraStream) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                cameraStream = stream;
                addVideoStream(stream);
                cameraIcon.classList.replace("fa-video", "fa-video-slash");
                cameraBtn.innerHTML = '<i class="fas fa-video-slash" id="cameraIcon"></i> Disable Camera';
            })
            .catch(error => {
                console.error("Camera access denied:", error);
                alert("Could not access camera. Please check permissions.");
            });
    } else {
        stopMediaStream(cameraStream);
        cameraStream = null;
        cameraIcon.classList.replace("fa-video-slash", "fa-video");
        cameraBtn.innerHTML = '<i class="fas fa-video" id="cameraIcon"></i> Enable Camera';
        
        const videoGrid = document.getElementById("videoGrid");
        if (videoGrid) {
            videoGrid.innerHTML = '<div class="placeholder-text">Camera preview will appear here</div>';
        }
    }
}

// Function to toggle microphone
function toggleMicrophone() {
    const microphoneBtn = document.getElementById("microphoneBtn");
    const microphoneIcon = document.getElementById("microphoneIcon");
    
    if (!microphoneBtn || !microphoneIcon) return;

    if (!microphoneStream) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                microphoneStream = stream;
                microphoneIcon.classList.replace("fa-microphone", "fa-microphone-slash");
                microphoneBtn.innerHTML = '<i class="fas fa-microphone-slash" id="microphoneIcon"></i> Disable Microphone';
            })
            .catch(error => {
                console.error("Microphone access denied:", error);
                alert("Could not access microphone. Please check permissions.");
            });
    } else {
        stopMediaStream(microphoneStream);
        microphoneStream = null;
        microphoneIcon.classList.replace("fa-microphone-slash", "fa-microphone");
        microphoneBtn.innerHTML = '<i class="fas fa-microphone" id="microphoneIcon"></i> Enable Microphone';
    }
}

// Function to generate a random meeting ID
function generateMeetingID() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Function to generate a unique meeting link
function generateUniqueMeetingLink() {
    const linkId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
    const baseUrl = window.location.origin;
    return `${baseUrl}/join.html?link=${linkId}`;
}

// Function to start the meeting
function startMeeting() {
    const userNameInput = document.getElementById('userName');
    if (userNameInput) {
        currentUser.name = userNameInput.value || "Guest";
        sessionStorage.setItem('userName', currentUser.name);
    }
    
    const meetingID = generateMeetingID();
    const uniqueLink = generateUniqueMeetingLink();
    const shareableLink = uniqueLink;
    const linkParts = uniqueLink.split('link=');
    const linkId = linkParts[1];

    document.getElementById("meetingID").innerText = meetingID;
    document.getElementById("meetingLink").value = shareableLink;
    document.getElementById("startMeetingInfo").style.display = "block";
    
    createMeetingWithLink(meetingID, linkId, shareableLink);
}

// Function to create meeting in Firebase with link
function createMeetingWithLink(meetingID, linkId, shareableLink) {
    currentUser.id = currentUser.id || 'user_' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('userID', currentUser.id);
    
    db.ref('meetings/' + meetingID).set({
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: currentUser.id,
        active: true,
        meetingLink: shareableLink
    }).then(() => {
        return db.ref('meetings/' + meetingID + '/participants/' + currentUser.id).set({
            name: currentUser.name,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            isHost: true,
            hasVideo: !!cameraStream,
            hasAudio: !!microphoneStream,
            isOnline: true
        });
    }).then(() => {
        return db.ref('meetingLinks/' + linkId).set({
            link: shareableLink,
            meetingID: meetingID,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            createdBy: currentUser.id
        });
    }).catch(error => {
        console.error("Error creating meeting:", error);
        alert("Failed to create meeting. Please try again.");
    });
}

// Function to enter the created meeting
function enterMeeting() {
    const meetingID = document.getElementById("meetingID").innerText;
    if (!meetingID) {
        alert("No meeting ID found. Please create a meeting first.");
        return;
    }
    
    sessionStorage.setItem('meetingID', meetingID);
    sessionStorage.setItem('userID', currentUser.id);
    sessionStorage.setItem('userName', currentUser.name);
    sessionStorage.setItem('isHost', 'true');
    
    window.location.href = `meetingroom.html?id=${meetingID}`;
}

// Function to show join meeting form
function showJoinForm() {
    const joinForm = document.getElementById("joinMeetingForm");
    if (joinForm) {
        joinForm.style.display = joinForm.style.display === "none" ? "block" : "none";
    }
}

// Function to join an existing meeting
function joinExistingMeeting() {
    const meetingID = document.getElementById("joinMeetingID").value.trim();
    const userName = document.getElementById("participantName").value.trim() || "Guest";
    
    if (!meetingID) {
        alert("Please enter a meeting ID");
        return;
    }
    
    currentUser.name = userName;
    sessionStorage.setItem('userName', userName);
    
    db.ref('meetings/' + meetingID).once('value')
        .then(snapshot => {
            if (snapshot.exists() && snapshot.val().active) {
                return db.ref('meetings/' + meetingID + '/participants/' + currentUser.id).set({
                    name: userName,
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    isHost: false,
                    hasVideo: !!cameraStream,
                    hasAudio: !!microphoneStream,
                    isOnline: true
                });
            } else {
                throw new Error("Meeting not found or inactive");
            }
        })
        .then(() => {
            sessionStorage.setItem('meetingID', meetingID);
            sessionStorage.setItem('isHost', 'false');
            window.location.href = `meetingroom.html?id=${meetingID}`;
        })
        .catch(error => {
            console.error("Error joining meeting:", error);
            alert("Failed to join meeting: " + error.message);
        });
}

// Function to copy the meeting link
function copyMeetingLink() {
    const meetingLink = document.getElementById("meetingLink");
    if (!meetingLink) return;
    
    meetingLink.select();
    document.execCommand("copy");
    
    const originalValue = meetingLink.value;
    meetingLink.value = "Copied!";
    setTimeout(() => {
        meetingLink.value = originalValue;
    }, 1500);
}

// Function to add a video stream to the grid
function addVideoStream(stream) {
    const videoGrid = document.getElementById("videoGrid");
    if (!videoGrid) return;
    
    videoGrid.innerHTML = ""; // Clear placeholder text

    const videoBox = document.createElement("div");
    videoBox.classList.add("video-box");

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true; // Mute to prevent feedback
    video.playsInline = true;

    videoBox.appendChild(video);
    videoGrid.appendChild(videoBox);
}

// Function to stop media stream
function stopMediaStream(stream) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

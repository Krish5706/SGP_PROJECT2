let cameraStream = null;
let microphoneStream = null;

// Function to generate a random meeting ID
function generateMeetingID() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Function to toggle camera
function toggleCamera() {
    const cameraBtn = document.getElementById("cameraBtn");
    const cameraIcon = document.getElementById("cameraIcon");

    if (!cameraStream) {
        // If the camera is not on, start the camera
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                cameraStream = stream;
                addVideoStream(stream);
                cameraIcon.classList.replace("fa-video", "fa-video-slash");
                cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i> Disable Camera'; // Text for Disable
            })
            .catch(error => {
                console.error("Camera access denied:", error);
            });
    } else {
        // If the camera is on, stop the camera
        stopMediaStream(cameraStream);
        cameraStream = null;
        cameraIcon.classList.replace("fa-video-slash", "fa-video");
        cameraBtn.innerHTML = '<i class="fas fa-video"></i> Enable Camera'; // Text for Enable
    }
}

// Function to toggle microphone
function toggleMicrophone() {
    const microphoneBtn = document.getElementById("microphoneBtn");
    const microphoneIcon = document.getElementById("microphoneIcon");

    if (!microphoneStream) {
        // If the microphone is not on, start the microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                microphoneStream = stream;
                microphoneIcon.classList.replace("fa-microphone", "fa-microphone-slash");
                microphoneBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Disable Microphone'; // Text for Disable
            })
            .catch(error => {
                console.error("Microphone access denied:", error);
            });
    } else {
        // If the microphone is on, stop the microphone
        stopMediaStream(microphoneStream);
        microphoneStream = null;
        microphoneIcon.classList.replace("fa-microphone-slash", "fa-microphone");
        microphoneBtn.innerHTML = '<i class="fas fa-microphone"></i> Enable Microphone'; // Text for Enable
    }
}

// Function to start the meeting
function startMeeting() {
    const meetingID = generateMeetingID();
    const meetingLink = `https://transcendmeet.com/join/${meetingID}`;

    document.getElementById("meetingID").innerText = meetingID;
    document.getElementById("meetingLink").value = meetingLink;
}

// Function to copy the meeting link
function copyMeetingLink() {
    const meetingLink = document.getElementById("meetingLink");
    meetingLink.select();
    document.execCommand("copy");
}

// Function to add a video stream to the grid
function addVideoStream(stream) {
    const videoGrid = document.getElementById("videoGrid");
    videoGrid.innerHTML = ""; // Clear placeholder text

    const videoBox = document.createElement("div");
    videoBox.classList.add("video-box");

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

    videoBox.appendChild(video);
    videoGrid.appendChild(videoBox);
}

// Function to stop media stream
function stopMediaStream(stream) {
    stream.getTracks().forEach(track => track.stop());
}

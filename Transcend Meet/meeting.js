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
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                cameraStream = stream;
                addVideoStream(stream);
                cameraIcon.classList.replace("fa-video", "fa-video-slash");
                cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i> Disable Camera';
            })
            .catch(error => {
                console.error("Camera access denied:", error);
                alert("Please allow camera access.");
            });
    } else {
        stopMediaStream(cameraStream);
        cameraStream = null;
        cameraIcon.classList.replace("fa-video-slash", "fa-video");
        cameraBtn.innerHTML = '<i class="fas fa-video"></i> Allow Camera';
    }
}

// Function to toggle microphone
function toggleMicrophone() {
    const microphoneBtn = document.getElementById("microphoneBtn");
    const microphoneIcon = document.getElementById("microphoneIcon");

    if (!microphoneStream) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                microphoneStream = stream;
                microphoneIcon.classList.replace("fa-microphone", "fa-microphone-slash");
                microphoneBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Disable Microphone';
            })
            .catch(error => {
                console.error("Microphone access denied:", error);
                alert("Please allow microphone access.");
            });
    } else {
        stopMediaStream(microphoneStream);
        microphoneStream = null;
        microphoneIcon.classList.replace("fa-microphone-slash", "fa-microphone");
        microphoneBtn.innerHTML = '<i class="fas fa-microphone"></i> Allow Microphone';
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
    alert("Meeting link copied!");
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

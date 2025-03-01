let localStream;
let screenStream;
let isVideoGrid = true;
let latencyInterval;

// Start Local Camera Stream
function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            const videoElement = document.createElement("video");
            videoElement.srcObject = stream;
            videoElement.autoplay = true;
            videoElement.id = "local-video";
            document.getElementById("video-container").appendChild(videoElement);
        })
        .catch(error => console.error("Error accessing camera and microphone:", error));
}

// Toggle Microphone
document.getElementById("mic-toggle").addEventListener("click", () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    const micIcon = audioTrack.enabled ? "fa-microphone" : "fa-microphone-slash";
    document.getElementById("mic-toggle").innerHTML = `<i class="fas ${micIcon}"></i>`;
});

// Toggle Camera
document.getElementById("cam-toggle").addEventListener("click", () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    const camIcon = videoTrack.enabled ? "fa-video" : "fa-video-slash";
    document.getElementById("cam-toggle").innerHTML = `<i class="fas ${camIcon}"></i>`;
});

// Toggle Screen Share
document.getElementById("screen-share-toggle").addEventListener("click", () => {
    if (screenStream) {
        stopStream(screenStream);
        screenStream = null;
        document.getElementById("screen-share-toggle").innerHTML = `<i class="fas fa-desktop"></i>`;
    } else {
        navigator.mediaDevices.getDisplayMedia({ video: true })
            .then(stream => {
                screenStream = stream;
                const videoElement = document.createElement("video");
                videoElement.srcObject = stream;
                videoElement.autoplay = true;
                document.getElementById("video-container").appendChild(videoElement);
                document.getElementById("screen-share-toggle").innerHTML = `<i class="fas fa-desktop-slash"></i>`;
            })
            .catch(error => console.error("Error sharing screen:", error));
    }
});

// Toggle Video Grid
document.getElementById("grid-toggle").addEventListener("click", () => {
    const videoContainer = document.getElementById("video-container");
    if (isVideoGrid) {
        videoContainer.style.display = "block"; // Switch to grid
    } else {
        videoContainer.style.display = "flex"; // Switch to single speaker view
    }
    isVideoGrid = !isVideoGrid;
});

// Toggle Emoji Reaction
document.getElementById("reaction-emoji").addEventListener("click", () => {
    alert("You reacted with a smile! 😄");
});

// End Call
document.getElementById("end-call").addEventListener("click", () => {
    stopStream(localStream);
    stopStream(screenStream);
    alert("Call Ended");
    window.location.href = '/'; // Redirect after the call ends
});

// Send Chat Message
document.getElementById("send-message").addEventListener("click", () => {
    const message = document.getElementById("chat-input").value;
    if (message) {
        const messageElement = document.createElement("p");
        messageElement.innerText = message;
        document.getElementById("chat-messages").appendChild(messageElement);
        document.getElementById("chat-input").value = "";
    }
});

// Close Chat Panel
document.getElementById("close-chat").addEventListener("click", () => {
    document.getElementById("chat-panel").style.display = "none";
});

// Show Chat Panel
document.getElementById("emoji-toggle").addEventListener("click", () => {
    document.getElementById("chat-panel").style.display = "block";
});

// Latency Display
function showLatency() {
    if (latencyInterval) clearInterval(latencyInterval);

    latencyInterval = setInterval(() => {
        const latency = Math.floor(Math.random() * 100); // Random latency
        document.getElementById("latency-display").innerText = `Latency: ${latency}ms`;
    }, 1000);
}

// Start Everything
startLocalStream();
showLatency();

function stopStream(stream) {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
}

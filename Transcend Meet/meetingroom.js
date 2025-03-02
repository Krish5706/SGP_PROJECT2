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
// End Call
// End Call
// End Call with confirmation
document.getElementById("end-call").addEventListener("click", () => {
    const confirmLeave = confirm("Are you sure you want to leave the meeting?");
    if (confirmLeave) {
        stopStream(localStream);
        stopStream(screenStream);
        window.location.href = 'main.html'; // Redirect to main.html
    }
    // If the user clicks "Cancel", nothing happens and they stay in the meeting
});


const participantName = "You"; // Replace with actual participant name if dynamic

// Send message on button click
document.getElementById("send-message").addEventListener("click", sendMessage);

// Send message on Enter key press
document.getElementById("chat-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission or line break
        sendMessage();
    }
});

// Send message function
function sendMessage() {
    const messageInput = document.getElementById("chat-input");
    const message = messageInput.value.trim();

    if (message !== "") {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageElement = document.createElement("div");
        messageElement.className = "chat-message";
        messageElement.innerHTML = `
            <strong>${participantName}</strong>
            <span style="font-size: 0.8em; color: gray; margin-left: 5px;">${time}</span>
            <div>${message}</div>
        `;

        const chatMessages = document.getElementById("chat-messages");
        chatMessages.appendChild(messageElement);

        messageInput.value = "";

        // Auto-scroll to latest message
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

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

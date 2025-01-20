let localStream;
const peers = new Map(); // Store peer connections
const videoElements = new Map(); // Store video elements
let ws;

// Get room ID from URL or generate new one
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || Math.random().toString(36).substring(7);
const userId = Math.random().toString(36).substring(7);

// Update URL with room ID
if (!urlParams.has('room')) {
    window.history.replaceState(null, '', `?room=${roomId}`);
}

// Display room ID
document.getElementById('roomId').textContent = roomId;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Initialize WebSocket connection
function initWebSocket() {
    ws = new WebSocket(`ws://${window.location.host}`);
    
    ws.onopen = () => {
        // Join room when connection opens
        ws.send(JSON.stringify({
            type: 'join',
            roomId,
            userId
        }));
    };
    
    ws.onmessage = handleSignalingMessage;
}

// Create new peer connection for user
function createPeerConnection(targetUserId) {
    const peerConnection = new RTCPeerConnection(configuration);
    peers.set(targetUserId, peerConnection);
    
    // Add local stream
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate,
                target: targetUserId,
                roomId
            }));
        }
    };
    
    // Handle incoming stream
    peerConnection.ontrack = (event) => {
        if (!videoElements.has(targetUserId)) {
            createVideoElement(targetUserId, event.streams[0]);
        }
    };
    
    return peerConnection;
}

// Create video element for new participant
function createVideoElement(userId, stream) {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    
    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = `Participant ${userId.substring(0, 4)}`;
    
    videoContainer.appendChild(video);
    videoContainer.appendChild(label);
    document.getElementById('videoGrid').appendChild(videoContainer);
    
    videoElements.set(userId, videoContainer);
    updateParticipantCount();
}

// Remove video element when participant leaves
function removeVideoElement(userId) {
    const videoContainer = videoElements.get(userId);
    if (videoContainer) {
        videoContainer.remove();
        videoElements.delete(userId);
        updateParticipantCount();
    }
}

// Update participant count display
function updateParticipantCount() {
    const count = videoElements.size + 1; // +1 for local user
    document.getElementById('participantCount').textContent = count;
}

// Handle signaling messages
async function handleSignalingMessage(event) {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
        case 'user-joined':
            // Create peer connection for new user
            const pc = createPeerConnection(message.userId);
            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({
                type: 'offer',
                offer: offer,
                target: message.userId,
                roomId
            }));
            break;
            
        case 'user-left':
            // Remove peer connection and video element
            if (peers.has(message.userId)) {
                peers.get(message.userId).close();
                peers.delete(message.userId);
            }
            removeVideoElement(message.userId);
            break;
            
        case 'offer':
            // Handle incoming offer
            let peerConnection = peers.get(message.sender) || createPeerConnection(message.sender);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            ws.send(JSON.stringify({
                type: 'answer',
                answer: answer,
                target: message.sender,
                roomId
            }));
            break;
            
        case 'answer':
            // Handle incoming answer
            await peers.get(message.sender).setRemoteDescription(new RTCSessionDescription(message.answer));
            break;
            
        case 'candidate':
            // Handle ICE candidate
            if (peers.has(message.sender)) {
                await peers.get(message.sender).addIceCandidate(new RTCIceCandidate(message.candidate));
            }
            break;
    }
}

// Start video conference
async function startVideoConference() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        initWebSocket();
    } catch (error) {
        console.error('Error starting video conference:', error);
        alert('Error accessing camera/microphone. Please check permissions.');
    }
}

// Control button handlers
document.getElementById('audioBtn').addEventListener('click', (e) => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    e.target.textContent = audioTrack.enabled ? 'Mute Audio' : 'Unmute Audio';
});

document.getElementById('videoBtn').addEventListener('click', (e) => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    e.target.textContent = videoTrack.enabled ? 'Stop Video' : 'Start Video';
});

document.getElementById('shareBtn').addEventListener('click', () => {
    const roomUrl = window.location.href;
    navigator.clipboard.writeText(roomUrl)
        .then(() => alert('Room link copied to clipboard!'))
        .catch(err => {
            console.error('Failed to copy:', err);
            alert('Room URL: ' + roomUrl);
        });
});

document.getElementById('endCallBtn').addEventListener('click', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    peers.forEach(peer => peer.close());
    if (ws) {
        ws.close();
    }
    window.location.href = window.location.pathname;
});

// Start the video conference
startVideoConference();

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
});
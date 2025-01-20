let localStream;
const peers = new Map();
const videoElements = new Map();
let ws;
let currentCameraFacing = 'user'; // or 'environment'

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || Math.random().toString(36).substring(7);
const userId = Math.random().toString(36).substring(7);

// Update URL with room ID
if (!urlParams.has('room')) {
    window.history.replaceState(null, '', `?room=${roomId}`);
}

document.getElementById('roomId').textContent = roomId;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

async function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'join',
            roomId,
            userId
        }));
    };
    
    ws.onmessage = handleSignalingMessage;
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showError('Connection error. Please try again.');
    };
    
    ws.onclose = () => {
        setTimeout(() => {
            initWebSocket(); // Attempt to reconnect
        }, 3000);
    };
}

// Initialize media stream with mobile constraints
async function initializeMediaStream(facingMode = 'user') {
    const constraints = {
        video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
    };

    try {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('localVideo').srcObject = localStream;
        return true;
    } catch (error) {
        console.error('Media stream error:', error);
        showError('Camera/Microphone access denied. Please check permissions.');
        return false;
    }
}

// Switch between front and back cameras
async function switchCamera() {
    currentCameraFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
    
    const success = await initializeMediaStream(currentCameraFacing);
    if (success) {
        // Update all peer connections with new stream
        peers.forEach(peer => {
            localStream.getTracks().forEach(track => {
                const sender = peer.getSenders().find(s => s.track.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track);
                }
            });
        });
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px;">OK</button>
    `;
    document.body.appendChild(errorDiv);
}

// Share meeting link
async function shareMeetingLink() {
    const meetingUrl = window.location.href;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Join my video meeting',
                text: 'Click the link to join the video meeting:',
                url: meetingUrl
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                fallbackShare(meetingUrl);
            }
        }
    } else {
        fallbackShare(meetingUrl);
    }
}

function fallbackShare(url) {
    navigator.clipboard.writeText(url)
        .then(() => alert('Meeting link copied to clipboard!'))
        .catch(() => {
            alert('Meeting URL: ' + url);
        });
}

// Initialize everything
async function startVideoConference() {
    try {
        const success = await initializeMediaStream();
        if (success) {
            initWebSocket();
            setupEventListeners();
            setupWakeLock();
        }
    } catch (error) {
        console.error('Error starting video conference:', error);
        showError('Failed to start video conference. Please try again.');
    }
}

// Keep screen on
async function setupWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            await navigator.wakeLock.request('screen');
        } catch (err) {
            console.error('Wake Lock error:', err);
        }
    }
}

// Set up all event listeners
function setupEventListeners() {
    document.getElementById('audioBtn').addEventListener('click', () => {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        document.getElementById('audioBtn').textContent = audioTrack.enabled ? '🎤' : '🔇';
    });

    document.getElementById('videoBtn').addEventListener('click', () => {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        document.getElementById('videoBtn').textContent = videoTrack.enabled ? '📷' : '🚫';
    });

    document.getElementById('switchCameraBtn').addEventListener('click', switchCamera);
    document.getElementById('shareBtn').addEventListener('click', shareMeetingLink);
    document.getElementById('endCallBtn').addEventListener('click', endCall);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        // Reconnect camera if needed
        if (!localStream || !localStream.active) {
            initializeMediaStream(currentCameraFacing);
        }
    }
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    peers.forEach(peer => peer.close());
    if (ws) {
        ws.close();
    }
    window.location.href = window.location.pathname;
}

// Start everything when page loads
document.addEventListener('DOMContentLoaded', startVideoConference);

// Prevent accidental exits
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
});
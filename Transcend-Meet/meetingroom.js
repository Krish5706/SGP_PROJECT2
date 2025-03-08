// WebRTC configuration

let localVideoTrack;
let localAudioTrack;
let remoteStreams = {};
let pendingICECandidates = {};

// WebRTC configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.google.com:19302' },
        { urls: 'stun:stun2.google.com:19302' },
        { urls: 'stun:stun3.google.com:19302' },
        { urls: 'stun:stun4.google.com:19302' },
        // For production, add TURN servers for reliable connections
        // {
        //     urls: 'turn:your-turn-server.com:3478',
        //     username: 'username',
        //     credential: 'password'
        // }
    ],
    iceCandidatePoolSize: 10
};


// Meeting variables
let localStream;
let screenStream;
let isVideoGrid = true;
let meetingID;
let currentUser = {
    id: null,
    name: "Guest",
    isHost: false
};
let participants = {};
let peerConnections = {};
let dataChannels = {};
let isWhiteboardActive = false;
let firebaseListenersActive = false;
let isReactionPanelVisible = false;
let isFirebaseInitialized = false;

// Initialize meeting room when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing meeting room...");
    
    // Check Firebase initialization
    checkFirebaseInitialization();
    
    // Verify required DOM elements
    if (verifyRequiredDOMElements()) {
        initMeetingRoom();
        // Set up UI event listeners
        setupEventListeners();
    } else {
        alert("Some required page elements are missing. The application may not work correctly.");
    }
    
    // Add emergency end call button if the regular one isn't found
    addEmergencyEndCallButton();
});

// Check if Firebase is initialized properly
function checkFirebaseInitialization() {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        console.log("Firebase is defined and initialized");
        isFirebaseInitialized = true;
        
        // Test database connection
        try {
            firebase.database().ref('.info/connected').on('value', function(snap) {
                if (snap.val() === true) {
                    console.log("Connected to Firebase database");
                    updateConnectionStatus(true);
                } else {
                    console.error("Disconnected from Firebase database");
                    updateConnectionStatus(false);
                }
            });
        } catch (error) {
            console.error("Error checking Firebase connection:", error);
            isFirebaseInitialized = false;
        }
    } else {
        console.error("Firebase is not initialized! Many features will not work.");
        alert("Database connection error. Features requiring database connectivity will not work properly.");
        updateConnectionStatus(false);
        isFirebaseInitialized = false;
    }
}

// Verify that all required DOM elements exist
function verifyRequiredDOMElements() {
    const requiredElements = [
        'video-container', 'mic-toggle', 'cam-toggle', 'screen-share-toggle',
        'participants-toggle', 'chat-toggle', 'whiteboard-toggle', 'end-call',
        'chat-input', 'send-message', 'chat-panel', 'participants-panel',
        'whiteboard-container', 'meeting-id-display'
    ];
    
    console.log("Checking for required DOM elements:");
    let missingElements = [];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Missing required element: #${id}`);
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.error("Missing elements that will affect functionality:", missingElements);
        return false;
    } else {
        console.log("All required DOM elements found");
        return true;
    }
}

// Add emergency end call button if regular button not found
function addEmergencyEndCallButton() {
    setTimeout(() => {
        if (!document.getElementById('end-call')) {
            console.warn("End call button not found. Creating emergency end call button");
            const emergencyButton = document.createElement('button');
            emergencyButton.id = 'emergency-end-call';
            emergencyButton.textContent = "EMERGENCY END";
            emergencyButton.style.cssText = 
                "position: fixed; bottom: 10px; right: 10px; z-index: 9999; " +
                "background: red; color: white; padding: 10px; " +
                "border-radius: 5px; border: none; cursor: pointer;";
            emergencyButton.addEventListener('click', function() {
                console.log("Emergency end button clicked");
                endMeeting();
            });
            document.body.appendChild(emergencyButton);
        }
    }, 2000);
}

// Initialize meeting room
function initMeetingRoom() {
    console.log("Initializing meeting room...");
    
    // Get meeting ID from URL or session storage
    const urlParams = new URLSearchParams(window.location.search);
    meetingID = urlParams.get('id') || sessionStorage.getItem('meetingID');
    
    if (!meetingID) {
        alert("Invalid meeting. Redirecting to home page.");
        window.location.href = "meeting.html";
        return;
    }
    
    // Get user information from session storage
    currentUser.id = sessionStorage.getItem('userID');
    currentUser.name = sessionStorage.getItem('userName') || "Guest";
    currentUser.isHost = sessionStorage.getItem('isHost') === 'true';
    
    if (!currentUser.id) {
        // Generate random user ID if not available
        currentUser.id = 'user_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('userID', currentUser.id);
    }
    
    // Display meeting ID
    const meetingIdDisplay = document.getElementById('meeting-id-display');
    if (meetingIdDisplay) {
        meetingIdDisplay.textContent = meetingID;
    }
    
    // Start local stream
    startLocalStream();
    
    // Connect to Firebase if initialized
    if (isFirebaseInitialized) {
        connectToMeeting();
    } else {
        console.error("Cannot connect to meeting: Firebase not initialized");
    }
    
    // Initialize whiteboard
    initializeWhiteboard();
    
    // Update connection status
    updateConnectionStatus(isFirebaseInitialized);
}

// Set up UI event listeners
function setupEventListeners() {
    console.log("Setting up event listeners");
    
    // Control buttons
    setupControlButton('mic-toggle', toggleMicrophone);
    setupControlButton('cam-toggle', toggleCamera);
    setupControlButton('screen-share-toggle', toggleScreenShare);
    setupControlButton('participants-toggle', toggleParticipantsPanel);
    setupControlButton('chat-toggle', toggleChatPanel);
    setupControlButton('whiteboard-toggle', toggleWhiteboard);
    setupControlButton('end-call', endMeeting);
    setupControlButton('copy-meeting-info', copyMeetingInfo);
    setupControlButton('reaction-toggle', toggleReactionPanel);

    // Chat elements
    setupControlButton('send-message', sendChatMessage);
    
    // Chat input keypress
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    // Close buttons for panels
    setupControlButton('close-participants', () => togglePanel('participants-panel', false));
    setupControlButton('close-chat', () => togglePanel('chat-panel', false));
    setupControlButton('close-whiteboard', () => togglePanel('whiteboard-container', false));
    
    // Set up reaction buttons
    setupReactionButtons();
}

// Helper to safely set up button event listeners
function setupControlButton(buttonId, clickHandler) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', function(e) {
            console.log(`Button ${buttonId} clicked`);
            clickHandler(e);
        });
    } else {
        console.warn(`Button with id '${buttonId}' not found in DOM`);
    }
}

// Start local media stream
function startLocalStream() {
    console.log("Attempting to access media devices...");
    
    // Show camera/mic access indicator
    updateMediaAccessStatus('pending');
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            console.log("Successfully obtained media stream");
            localStream = stream;
            
            // Update UI to show success
            updateMediaAccessStatus('success');
            
            // Create video element for local stream
            const localVideo = document.createElement('video');
            localVideo.srcObject = stream;
            localVideo.autoplay = true;
            localVideo.muted = true; // Mute local video to prevent feedback
            localVideo.classList.add('video-item');
            
            const videoWrapper = document.createElement('div');
            videoWrapper.classList.add('video-wrapper');
            videoWrapper.dataset.userId = currentUser.id;
            
            const nameTag = document.createElement('div');
            nameTag.classList.add('video-name-tag');
            nameTag.textContent = currentUser.name + ' (You)';
            
            videoWrapper.appendChild(localVideo);
            videoWrapper.appendChild(nameTag);
            
            const videoContainer = document.getElementById('video-container');
            if (videoContainer) {
                videoContainer.appendChild(videoWrapper);
            } else {
                console.error("Video container element not found");
            }

            // Connect to participants
            connectToParticipants();
        })
        .catch(error => {
            console.error("Error accessing media devices:", error);
            
            // Update UI to show failure
            updateMediaAccessStatus('error', error.message);
            
            // Try to access at least audio if video fails
            tryAudioOnlyFallback();
        });
}

// Try to get audio only if video+audio fails
function tryAudioOnlyFallback() {
    console.log("Trying audio-only fallback");
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then(stream => {
            console.log("Successfully obtained audio-only stream");
            localStream = stream;
            
            // Update UI
            updateMediaAccessStatus('audio-only');
            
            // Create audio-only representation
            const audioOnlyElement = document.createElement('div');
            audioOnlyElement.classList.add('audio-only-participant');
            
            const userInitial = document.createElement('div');
            userInitial.classList.add('user-initial');
            userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
            
            const nameTag = document.createElement('div');
            nameTag.classList.add('video-name-tag');
            nameTag.textContent = currentUser.name + ' (You, Audio Only)';
            
            audioOnlyElement.appendChild(userInitial);
            audioOnlyElement.appendChild(nameTag);
            
            const videoWrapper = document.createElement('div');
            videoWrapper.classList.add('video-wrapper');
            videoWrapper.dataset.userId = currentUser.id;
            videoWrapper.appendChild(audioOnlyElement);
            
            const videoContainer = document.getElementById('video-container');
            if (videoContainer) {
                videoContainer.appendChild(videoWrapper);
            }

            // Connect to participants
            connectToParticipants();
            
            // Disable video button
            const camToggle = document.getElementById('cam-toggle');
            if (camToggle) {
                camToggle.innerHTML = '<i class="fas fa-video-slash"></i>';
                camToggle.disabled = true;
                camToggle.title = "Video unavailable";
            }
        })
        .catch(error => {
            console.error("Error accessing audio-only:", error);
            updateMediaAccessStatus('complete-failure');
            
            alert("Could not access camera or microphone. Please check permissions and reload the page.");
        });
}

// Update media access status UI
function updateMediaAccessStatus(status, errorMessage) {
    console.log("Media access status updated:", status);
    
    // This function would update some UI element to show media access status
    // You would need to add this element to your HTML
    const statusElement = document.getElementById('media-access-status');
    if (!statusElement) return;
    
    switch(status) {
        case 'pending':
            statusElement.textContent = "Requesting camera and microphone access...";
            statusElement.className = "status-pending";
            break;
        case 'success':
            statusElement.textContent = "Camera and microphone connected";
            statusElement.className = "status-success";
            setTimeout(() => { statusElement.style.display = 'none'; }, 3000);
            break;
        case 'audio-only':
            statusElement.textContent = "Microphone connected (no camera)";
            statusElement.className = "status-warning";
            break;
        case 'error':
            statusElement.textContent = "Media access error: " + (errorMessage || "Permission denied");
            statusElement.className = "status-error";
            break;
        case 'complete-failure':
            statusElement.textContent = "Could not access any media devices";
            statusElement.className = "status-error";
            break;
    }
}

// Connect to Firebase and set up listeners
function connectToMeeting() {
    if (!meetingID || !isFirebaseInitialized) {
        console.error("Cannot connect to meeting: no meeting ID or Firebase not initialized");
        return;
    }

    console.log("Connecting to meeting:", meetingID);
    
    db.ref(`meetings/${meetingID}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists() || !snapshot.val().active) {
                throw new Error("Meeting does not exist or is no longer active");
            }

            // Update or add current user as participant
            return db.ref(`meetings/${meetingID}/participants/${currentUser.id}`).set({
                name: currentUser.name,
                isOnline: true,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                isHost: currentUser.isHost,
                hasAudio: true,
                hasVideo: !!localStream && localStream.getVideoTracks().length > 0
            });
        })
        .then(() => {
            setupFirebaseListeners();
        })
        .catch(error => {
            console.error("Error connecting to meeting:", error);
            alert("Error: " + error.message);
            window.location.href = "meeting.html";
        });
}

// Setup Firebase listeners
function setupFirebaseListeners() {
    if (firebaseListenersActive || !isFirebaseInitialized) return;
    
    console.log("Setting up Firebase listeners");
    
    try {
        // Listen for participant changes
        db.ref(`meetings/${meetingID}/participants`).on('value', snapshot => {
            const participantsData = snapshot.val() || {};
            updateParticipantsList(participantsData);
        });
        
        // Listen for chat messages
        db.ref(`meetings/${meetingID}/messages`).on('child_added', snapshot => {
            const message = snapshot.val();
            displayChatMessage(message);
        });
        
        // Listen for reactions
        db.ref(`meetings/${meetingID}/reactions`).on('child_added', snapshot => {
            const reaction = snapshot.val();
            displayReaction(reaction);
            
            // Remove reaction data after displaying
            snapshot.ref.remove();
        });
        
        // Listen for meeting status changes
        db.ref(`meetings/${meetingID}/active`).on('value', snapshot => {
            console.log("Meeting active status changed:", snapshot.val());
            if (snapshot.exists() && snapshot.val() === false && !currentUser.isHost) {
                alert("The meeting has been ended by the host.");
                cleanupAndRedirect();
            }
        });
        
        // Set online status when disconnecting
        db.ref(`meetings/${meetingID}/participants`).on('child_added', snapshot => {
            const participantId = snapshot.key;
            const participantData = snapshot.val();
            
            // Don't connect to self or offline participants
            if (participantId === currentUser.id || !participantData.isOnline) {
                return;
            }
            
            console.log(`New participant detected: ${participantData.name} (${participantId})`);
            
            // Initialize peer connection to this participant
            createPeerConnection(participantId, true);
        });
        
        // Listen for participant removals to clean up connections
        db.ref(`meetings/${meetingID}/participants`).on('child_removed', snapshot => {
            const participantId = snapshot.key;
            
            if (peerConnections[participantId]) {
                console.log(`Participant removed: ${participantId}, cleaning up connection`);
                closePeerConnection(participantId);
            }
        });
        
        // Listen for participant status changes
        db.ref(`meetings/${meetingID}/participants`).on('child_changed', snapshot => {
            const participantId = snapshot.key;
            const participantData = snapshot.val();
            
            // If participant went offline, close the connection
            if (participantId !== currentUser.id && !participantData.isOnline) {
                console.log(`Participant went offline: ${participantData.name} (${participantId})`);
                closePeerConnection(participantId);
            }
        });
        
        firebaseListenersActive = true;
    } catch (error) {
        console.error("Error setting up Firebase listeners:", error);
        alert("Error connecting to meeting data. Some features may not work correctly.");
    }
}

// Toggle Microphone
function toggleMicrophone() {
    console.log("Toggle microphone called");
    
    if (!localStream) {
        console.error("Cannot toggle microphone: No local stream available");
        alert("Microphone control unavailable. Please refresh the page.");
        return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
        console.error("No audio tracks found in stream");
        return;
    }
    
    const audioTrack = audioTracks[0];
    audioTrack.enabled = !audioTrack.enabled;
    console.log("Microphone " + (audioTrack.enabled ? "enabled" : "disabled"));

    const micToggle = document.getElementById('mic-toggle');
    if (micToggle) {
        micToggle.innerHTML = `<i class="fas ${audioTrack.enabled ? 'fa-microphone' : 'fa-microphone-slash'}"></i>`;
    }

    // Update status in Firebase
    updateParticipantAudioStatus(audioTrack.enabled);
}

// Toggle Camera
function toggleCamera() {
    console.log("Toggle camera called");
    
    if (!localStream) {
        console.error("Cannot toggle camera: No local stream available");
        alert("Camera control unavailable. Please refresh the page.");
        return;
    }

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
        console.error("No video tracks found in stream");
        alert("No camera available");
        return;
    }
    
    const videoTrack = videoTracks[0];
    videoTrack.enabled = !videoTrack.enabled;
    console.log("Camera " + (videoTrack.enabled ? "enabled" : "disabled"));

    const camToggle = document.getElementById('cam-toggle');
    if (camToggle) {
        camToggle.innerHTML = `<i class="fas ${videoTrack.enabled ? 'fa-video' : 'fa-video-slash'}"></i>`;
    }

    // Update status in Firebase
    updateParticipantVideoStatus(videoTrack.enabled);
}

// Toggle Screen Share
function toggleScreenShare() {
    console.log("Toggle screen share called, current state:", !!screenStream);
    
    if (screenStream) {
        // Stop screen sharing
        console.log("Stopping screen sharing");
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;

        const screenShareToggle = document.getElementById('screen-share-toggle');
        if (screenShareToggle) {
            screenShareToggle.innerHTML = `<i class="fas fa-desktop"></i>`;
        }

        // Remove screen share video
        const screenShareEl = document.querySelector(`.video-wrapper[data-user-id="screen_${currentUser.id}"]`);
        if (screenShareEl) {
            screenShareEl.remove();
        }

        // Notify Firebase that screen sharing has stopped
        if (isFirebaseInitialized) {
            db.ref(`meetings/${meetingID}/screenShare/${currentUser.id}`).remove()
                .catch(error => console.error("Error updating screen share status:", error));
        }
    } else {
        // Start screen sharing
        console.log("Requesting display media for screen sharing");
        navigator.mediaDevices.getDisplayMedia({ video: true })
            .then(stream => {
                console.log("Screen sharing stream obtained successfully");
                screenStream = stream;

                // Create a new video element for the screen share
                const screenVideo = document.createElement('video');
                screenVideo.srcObject = stream;
                screenVideo.autoplay = true;
                screenVideo.classList.add('screen-share');
                
                const videoWrapper = document.createElement('div');
                videoWrapper.classList.add('video-wrapper', 'screen-share-wrapper');
                videoWrapper.dataset.userId = `screen_${currentUser.id}`;
                
                const nameTag = document.createElement('div');
                nameTag.classList.add('video-name-tag');
                nameTag.textContent = `${currentUser.name}'s Screen`;
                
                videoWrapper.appendChild(screenVideo);
                videoWrapper.appendChild(nameTag);
                
                const videoContainer = document.getElementById('video-container');
                if (videoContainer) {
                    videoContainer.appendChild(videoWrapper);
                } else {
                    console.error("Video container not found");
                }

                const screenShareToggle = document.getElementById('screen-share-toggle');
                if (screenShareToggle) {
                    screenShareToggle.innerHTML = `<i class="fas fa-stop-circle"></i>`;
                }

                // Notify Firebase that screen sharing is active
                if (isFirebaseInitialized) {
                    db.ref(`meetings/${meetingID}/screenShare/${currentUser.id}`).set({
                        userId: currentUser.id,
                        userName: currentUser.name,
                        active: true,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    }).catch(error => console.error("Error updating screen share status:", error));
                }

                // Stop screen sharing when the stream ends
                stream.getVideoTracks()[0].onended = () => {
                    console.log("Screen sharing ended by system event");
                    toggleScreenShare();
                };
            })
            .catch(error => {
                console.error("Error sharing screen:", error);
                alert("Screen sharing failed or was cancelled.");
            });
    }
}

// Update participant audio status in Firebase
function updateParticipantAudioStatus(isEnabled) {
    if (meetingID && currentUser.id && isFirebaseInitialized) {
        db.ref(`meetings/${meetingID}/participants/${currentUser.id}`).update({
            hasAudio: isEnabled
        }).catch(error => console.error("Error updating audio status:", error));
    }
}

// Update participant video status in Firebase
function updateParticipantVideoStatus(isEnabled) {
    if (meetingID && currentUser.id && isFirebaseInitialized) {
        db.ref(`meetings/${meetingID}/participants/${currentUser.id}`).update({
            hasVideo: isEnabled
        }).catch(error => console.error("Error updating video status:", error));
    }
}

// Send chat message to Firebase
function sendChatMessage() {
    console.log("Send chat message called");
    
    const messageInput = document.getElementById('chat-input');
    if (!messageInput || messageInput.value.trim() === "") {
        console.log("No message to send or input element not found");
        return;
    }

    if (!isFirebaseInitialized) {
        console.error("Cannot send message: Firebase not initialized");
        alert("Cannot send message: Not connected to database");
        return;
    }

    console.log("Sending message:", messageInput.value);
    
    const message = {
        userId: currentUser.id,
        userName: currentUser.name,
        text: messageInput.value,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref(`meetings/${meetingID}/messages`).push(message)
        .then(() => {
            console.log("Message sent successfully");
            messageInput.value = ""; // Clear input field
        })
        .catch(error => {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        });
}

// Display chat message in the chat area
function displayChatMessage(message) {
    console.log("Displaying chat message:", message);
    
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error("Chat messages container not found");
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.classList.add(message.userId === currentUser.id ? 'own-message' : 'other-message');

    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.innerHTML = `
        <div class="message-header">
            <strong>${message.userId === currentUser.id ? 'You' : message.userName}</strong>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-body">${sanitizeHTML(message.text)}</div>
    `;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
    
    // If chat panel is not visible, show notification
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel && message.userId !== currentUser.id && chatPanel.style.display === 'none') {
        showChatNotification(message);
    }
}

// Show notification for new chat message
function showChatNotification(message) {
    const chatToggle = document.getElementById('chat-toggle');
    if (chatToggle) {
        // Add notification indicator
        chatToggle.classList.add('has-notification');
        
        // Optional: show toast notification
        showToast(`New message from ${message.userName}`);
    }
}

// Show toast notification
function showToast(message, duration = 3000) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.style.display = 'block';
    
    // Hide after duration
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// End meeting or leave meeting
function endMeeting() {
    console.log("End meeting function called");
    
    // Verify meetingID
    if (!meetingID) {
        console.error("No meeting ID found");
        alert("No meeting ID found. Redirecting to main page.");
        window.location.href = "main.html";
        return;
    }
    
    const confirmMessage = currentUser.isHost 
        ? "Are you sure you want to end the meeting for all participants?" 
        : "Are you sure you want to leave the meeting?";

    if (confirm(confirmMessage)) {
        console.log("User confirmed ending meeting. User is host:", currentUser.isHost);
        
        if (!isFirebaseInitialized) {
            console.warn("Firebase not initialized, performing direct redirect");
            directRedirect();
            return;
        }
        
        if (currentUser.isHost) {
            console.log("Attempting to update meeting status in Firebase...");
            
            // End meeting for all
            try {
                db.ref(`meetings/${meetingID}`).update({
                    active: false,
                    endedAt: firebase.database.ServerValue.TIMESTAMP
                })
                .then(() => {
                    console.log("Meeting ended successfully in Firebase");
                    cleanupAndRedirect();
                })
                .catch(error => {
                    console.error("Error ending meeting:", error);
                    alert("Error ending meeting: " + error.message + ". Redirecting anyway.");
                    directRedirect();
                });
            } catch (e) {
                console.error("Exception when updating Firebase:", e);
                alert("Error accessing Firebase. Redirecting anyway.");
                directRedirect();
            }
        } else {
            // Just leave the meeting
            try {
                db.ref(`meetings/${meetingID}/participants/${currentUser.id}`).update({
                    isOnline: false,
                    leftAt: firebase.database.ServerValue.TIMESTAMP
                })
                .then(() => {
                    cleanupAndRedirect();
                })
                .catch(error => {
                    console.error("Error leaving meeting:", error);
                    directRedirect();
                });
            } catch (e) {
                console.error("Exception when updating participant status:", e);
                directRedirect();
            }
        }
    }
}

// Direct redirect - last resort when other methods fail
function directRedirect() {
    console.log("Using direct redirect to main.html");
    
    // Try regular redirect first
    try {
        window.location.replace("main.html");
    } catch (e) {
        console.error("Error with location.replace:", e);
    }
    
    // Last resort fallback with timeout
    setTimeout(() => {
        try {
            window.open("main.html", "_self");
        } catch (e) {
            console.error("Error with window.open:", e);
            alert("Please navigate back to the main page manually.");
        }
    }, 500);
}

// Cleanup and redirect to home page
function cleanupAndRedirect() {
    console.log("cleanupAndRedirect function called");
    
    // Stop all streams
    if (localStream) {
        console.log("Stopping local stream tracks");
        localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
        console.log("Stopping screen stream tracks");
        screenStream.getTracks().forEach(track => track.stop());
    }

    // Remove Firebase listeners
    if (firebaseListenersActive && isFirebaseInitialized) {
        console.log("Removing Firebase listeners");
        try {
            db.ref(`meetings/${meetingID}/participants`).off();
            db.ref(`meetings/${meetingID}/messages`).off();
            db.ref(`meetings/${meetingID}/reactions`).off();
            db.ref(`meetings/${meetingID}/active`).off();
            firebaseListenersActive = false;
        } catch (e) {
            console.error("Error removing Firebase listeners:", e);
        }
    }

    // Clear session storage
    console.log("Clearing session storage");
    sessionStorage.removeItem('meetingID');
    sessionStorage.removeItem('userID');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('isHost');


    // Add this to your cleanupAndRedirect function before redirecting
// Close all peer connections
Object.keys(peerConnections).forEach(participantId => {
    closePeerConnection(participantId);
});

// Add this to your Firebase listeners cleanup
db.ref(`meetings/${meetingID}/signals/${currentUser.id}`).off();

    // Redirect to main page
    console.log("Redirecting to main.html");
    window.location.href = "main.html";
    
    // Fallback redirect with delay
    setTimeout(() => {
        console.log("Fallback redirect triggered");
        directRedirect();
    }, 1000);
}

// Function to copy meeting info
function copyMeetingInfo() {
    console.log("Copy meeting info called");
    
    const meetingLink = `${window.location.origin}/meetingroom.html?id=${meetingID}`;
    const copyText = `Meeting ID: ${meetingID}\nMeeting Link: ${meetingLink}`;
    
    // Create a temporary textarea to copy text
    const textarea = document.createElement("textarea");
    textarea.value = copyText;
    document.body.appendChild(textarea);
    textarea.select();
    
    let copySuccess = false;
    try {
        copySuccess = document.execCommand("copy");
    } catch (err) {
        console.error("Copy failed:", err);
    }
    
    document.body.removeChild(textarea);
    
    // Show feedback
    const button = document.getElementById("copy-meeting-info");
    if (button) {
        const originalText = button.textContent;
        button.textContent = copySuccess ? "Copied!" : "Copy Failed";
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
    
    if (!copySuccess) {
        alert("Copy failed. Meeting ID: " + meetingID);
    }
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update participants list
function updateParticipantsList(participantsData) {
    console.log("Updating participants list");
    
    const participantsList = document.getElementById("participants-list");
    const participantCount = document.getElementById("participant-count");

    if (!participantsList || !participantCount) {
        console.error("Participants list elements not found");
        return;
    }

    // Clear current list
    participantsList.innerHTML = "";

    // Count online participants
    let onlineCount = 0;

    // Add each participant to the list
    Object.keys(participantsData).forEach(userId => {
        const participant = participantsData[userId];
        if (participant.isOnline) onlineCount++;

        const participantItem = document.createElement("div");
        participantItem.className = "participant-item";
        participantItem.dataset.userId = userId;

        const nameSpan = document.createElement("span");
        nameSpan.className = "participant-item-name";
        nameSpan.textContent = participant.name + (userId === currentUser.id ? " (You)" : "");

        const statusIcons = document.createElement("div");
        statusIcons.className = "participant-status-icons";

        const micIcon = document.createElement("i");
        micIcon.className = participant.hasAudio !== false ? "fas fa-microphone" : "fas fa-microphone-slash";

        const videoIcon = document.createElement("i");
        videoIcon.className = participant.hasVideo !== false ? "fas fa-video" : "fas fa-video-slash";

        const onlineStatus = document.createElement("span");
        onlineStatus.className = "online-status";
        onlineStatus.classList.add(participant.isOnline ? "online" : "offline");

        statusIcons.appendChild(micIcon);
        statusIcons.appendChild(videoIcon);
        statusIcons.appendChild(onlineStatus);

        participantItem.appendChild(nameSpan);
        participantItem.appendChild(statusIcons);

        participantsList.appendChild(participantItem);
    });

    // Update participant count
    participantCount.textContent = onlineCount;
}

// Update connection status UI
function updateConnectionStatus(isConnected) {
    console.log("Updating connection status:", isConnected);
    
    const connectionStatus = document.getElementById('connection-status');
    if (!connectionStatus) {
        console.warn("Connection status element not found");
        return;
    }
    
    const statusIndicator = connectionStatus.querySelector('.status-indicator');
    if (!statusIndicator) {
        console.warn("Status indicator element not found");
        return;
    }

    if (isConnected) {
        connectionStatus.style.display = 'flex';
        statusIndicator.classList.remove('disconnected');
        connectionStatus.querySelector('span').textContent = 'Connected';
    } else {
        connectionStatus.style.display = 'flex';
        statusIndicator.classList.add('disconnected');
        connectionStatus.querySelector('span').textContent = 'Disconnected';
    }
}

// Toggle panels functions
function togglePanel(panelId, show) {
    const panel = document.getElementById(panelId);
    if (!panel) {
        console.warn(`Panel ${panelId} not found`);
        return;
    }
    
    if (show === undefined) {
        // Toggle visibility
        console.log(`Toggling panel ${panelId}, current display: ${panel.style.display}`);
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    } else {
        // Set visibility explicitly
        console.log(`Setting panel ${panelId} display to ${show ? 'block' : 'none'}`);
        panel.style.display = show ? 'block' : 'none';
    }
    
    // If showing chat panel, clear notification
    if (panelId === 'chat-panel' && (show || panel.style.display === 'block')) {
        const chatToggle = document.getElementById('chat-toggle');
        if (chatToggle) {
            chatToggle.classList.remove('has-notification');
        }
    }
}

function toggleParticipantsPanel() {
    console.log("Toggle participants panel");
    togglePanel('participants-panel');
    
    const button = document.getElementById('participants-toggle');
    if (button) {
        button.classList.toggle('active');
    }
}

function toggleChatPanel() {
    console.log("Toggle chat panel");
    togglePanel('chat-panel');
    
    const button = document.getElementById('chat-toggle');
    if (button) {
        button.classList.toggle('active');
        button.classList.remove('has-notification');
    }
    
    // Focus the input when opening
    const chatPanel = document.getElementById('chat-panel');
    const chatInput = document.getElementById('chat-input');
    if (chatPanel && chatInput && chatPanel.style.display !== 'none') {
        setTimeout(() => chatInput.focus(), 100);
    }
}

// Toggle whiteboard visibility
function toggleWhiteboard() {
    console.log("Toggle whiteboard");
    
    const whiteboardContainer = document.getElementById('whiteboard-container');
    if (!whiteboardContainer) {
        console.error("Whiteboard container not found");
        return;
    }
    
    isWhiteboardActive = !isWhiteboardActive;
    
    if (isWhiteboardActive) {
        whiteboardContainer.style.display = 'flex'; // Use flex instead of block
        
        const button = document.getElementById('whiteboard-toggle');
        if (button) {
            button.classList.add('active');
        }
        
        // Initialize whiteboard after making it visible
        setTimeout(() => {
            try {
                initWhiteboard();
                console.log("Whiteboard initialized");
            } catch (e) {
                console.error("Error initializing whiteboard:", e);
            }
        }, 100); // Short delay to ensure the container is visible first
    } else {
        whiteboardContainer.style.display = 'none';
        
        const button = document.getElementById('whiteboard-toggle');
        if (button) {
            button.classList.remove('active');
        }
    }
}

// Initialize whiteboard
function initializeWhiteboard() {
    console.log("Attempting to initialize whiteboard...");
    
    // Check if whiteboard functions exist
    if (typeof initWhiteboard === 'function') {
        console.log("initWhiteboard function found");
        try {
            // Only initialize if visible
            const whiteboardContainer = document.getElementById('whiteboard-container');
            if (whiteboardContainer && whiteboardContainer.style.display !== 'none') {
                initWhiteboard();
                console.log("Whiteboard initialized successfully");
            } else {
                console.log("Whiteboard container not visible, initialization deferred");
            }
        } catch (e) {
            console.error("Error initializing whiteboard:", e);
            showWhiteboardError("Could not initialize whiteboard. Check console for errors.");
        }
    } else {
        console.error("Whiteboard functionality not available - initWhiteboard function not found");
        showWhiteboardError("Whiteboard functionality unavailable. Make sure whiteboard.js is loaded.");
    }
}

// Show whiteboard error
function showWhiteboardError(message) {
    const whiteboardContainer = document.getElementById('whiteboard-container');
    if (whiteboardContainer) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'whiteboard-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            padding: 20px;
            background-color: #ffebee;
            color: #c62828;
            border-radius: 4px;
            margin: 20px auto;
            max-width: 80%;
            text-align: center;
        `;
        
        // Clear existing content and show error
        whiteboardContainer.innerHTML = '';
        whiteboardContainer.appendChild(errorDiv);
    }
}

// REACTION FUNCTIONALITY
// -----------------------

// Toggle reaction panel
function toggleReactionPanel() {
    console.log("Toggle reaction panel");
    
    const reactionPanel = document.getElementById('reaction-panel');
    if (!reactionPanel) {
        console.error("Reaction panel not found");
        return;
    }
    
    isReactionPanelVisible = !isReactionPanelVisible;
    reactionPanel.style.display = isReactionPanelVisible ? 'flex' : 'none';
    
    const button = document.getElementById('reaction-toggle');
    if (button) {
        button.classList.toggle('active', isReactionPanelVisible);
    }
}

// Setup reaction buttons
function setupReactionButtons() {
    console.log("Setting up reaction buttons");
    
    const reactionButtons = document.querySelectorAll('.reaction-btn');
    if (reactionButtons.length === 0) {
        console.warn("No reaction buttons found");
    }
    
    reactionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const emoji = button.getAttribute('data-emoji');
            console.log("Reaction button clicked:", emoji);
            
            if (emoji) {
                sendReaction(emoji);
                toggleReactionPanel(); // Hide panel after selecting
            }
        });
    });
}

// Send reaction to Firebase
function sendReaction(emoji) {
    console.log("Sending reaction:", emoji);
    
    if (!meetingID || !currentUser.id) {
        console.error("Cannot send reaction: meeting ID or user ID missing");
        return;
    }
    
    // Also display the reaction locally for immediate feedback
    const reaction = {
        userId: currentUser.id,
        userName: currentUser.name,
        emoji: emoji,
        timestamp: Date.now()
    };
    
    // Display locally
    displayReaction(reaction);
    
    // Send to Firebase for other participants
    if (isFirebaseInitialized) {
        db.ref(`meetings/${meetingID}/reactions`).push(reaction)
            .catch(error => {
                console.error("Error sending reaction:", error);
            });
    }
}

// Display reaction on screen with enhanced animation
function displayReaction(reaction) {
    console.log("Displaying reaction:", reaction.emoji);
    
    // Create reaction container element
    const reactionContainer = document.createElement('div');
    reactionContainer.className = 'reaction-container';
    
    // Create emoji element
    const emojiElement = document.createElement('div');
    emojiElement.className = 'reaction-emoji';
    emojiElement.textContent = reaction.emoji;
    
    // Create user label
    const userLabel = document.createElement('div');
    userLabel.className = 'reaction-user';
    userLabel.textContent = reaction.userName;
    
    // Add elements to container
    reactionContainer.appendChild(emojiElement);
    reactionContainer.appendChild(userLabel);
    
    // Get the video container for positioning
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) {
        console.error("Video container not found, cannot display reaction");
        return;
    }
    
    const containerRect = videoContainer.getBoundingClientRect();
    
    // Position reaction horizontally at a random position
    const posX = Math.random() * (containerRect.width - 80) + 40; // Keep away from edges
    
    // Start from bottom of the container
    reactionContainer.style.left = `${posX}px`;
    reactionContainer.style.bottom = '0';
    
    // Add some randomization to make multiple reactions look natural
    const duration = 3 + Math.random() * 2; // 3-5 seconds duration
    const delay = Math.random() * 0.5; // 0-0.5 second delay
    const horizontalMovement = (Math.random() * 100) - 50; // -50px to +50px horizontal drift
    
    // Set custom properties for animation
    reactionContainer.style.setProperty('--duration', `${duration}s`);
    reactionContainer.style.setProperty('--delay', `${delay}s`);
    reactionContainer.style.setProperty('--h-movement', `${horizontalMovement}px`);
    
    // Append to container
    videoContainer.appendChild(reactionContainer);
    
    // Remove after animation completes
    setTimeout(() => {
        if (reactionContainer && reactionContainer.parentNode) {
            reactionContainer.parentNode.removeChild(reactionContainer);
        }
    }, (duration + delay) * 1000);
}


// Set up WebRTC listeners for signaling
function setupWebRTCListeners() {
    if (!isFirebaseInitialized || !meetingID) {
        console.error("Cannot set up WebRTC: Firebase not initialized or no meeting ID");
        return;
    }
    
    console.log("Setting up WebRTC listeners for meeting:", meetingID);
    
    // Check for existing participants first
    db.ref(`meetings/${meetingID}/participants`).once('value')
        .then(snapshot => {
            const participants = snapshot.val() || {};
            const onlineParticipants = Object.entries(participants)
                .filter(([id, data]) => data.isOnline && id !== currentUser.id);
                
            console.log(`Found ${onlineParticipants.length} online participants to connect with`);
            
            // Manually initiate connections to existing participants
            onlineParticipants.forEach(([participantId, participantData]) => {
                console.log(`Initiating connection to: ${participantData.name} (${participantId})`);
                createPeerConnection(participantId, true);
            });
        });
    
    // Listen for new participants to initiate connections
    db.ref(`meetings/${meetingID}/participants`).on('child_added', snapshot => {
        const participantId = snapshot.key;
        const participantData = snapshot.val();
        
        // Don't connect to self or offline participants
        if (participantId === currentUser.id || !participantData.isOnline) {
            return;
        }
        
        console.log(`New participant detected: ${participantData.name} (${participantId})`);
        
        // Initialize peer connection to this participant
        createPeerConnection(participantId, true);
    });
    
    // Listen for participant removals to clean up connections
    db.ref(`meetings/${meetingID}/participants`).on('child_removed', snapshot => {
        const participantId = snapshot.key;
        
        if (peerConnections[participantId]) {
            console.log(`Participant removed: ${participantId}, cleaning up connection`);
            closePeerConnection(participantId);
        }
    });
    
    // Listen for participant status changes
    db.ref(`meetings/${meetingID}/participants`).on('child_changed', snapshot => {
        const participantId = snapshot.key;
        const participantData = snapshot.val();
        
        // If participant went offline, close the connection
        if (participantId !== currentUser.id && !participantData.isOnline) {
            console.log(`Participant went offline: ${participantData.name} (${participantId})`);
            closePeerConnection(participantId);
        }
    });
    
    // Listen for WebRTC signaling messages
    db.ref(`meetings/${meetingID}/signals/${currentUser.id}`).on('child_added', snapshot => {
        const signal = snapshot.val();
        
        if (!signal || !signal.from) {
            console.error("Invalid signal received:", signal);
            snapshot.ref.remove();
            return;
        }
        
        console.log(`Received signal from ${signal.from}:`, signal.type);
        
        // Process the signal based on its type
        handleSignal(signal);
        
        // Remove the processed signal
        snapshot.ref.remove();
    });
}


// Create video element for remote participant
function createRemoteVideoElement(participantId) {
    console.log(`Creating video element for ${participantId}`);
    
    // Get participant name from Firebase
    db.ref(`meetings/${meetingID}/participants/${participantId}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.warn(`Participant ${participantId} not found in database`);
                return;
            }
            
            const participantData = snapshot.val();
            const participantName = participantData.name || "Unknown";
            
            console.log(`Creating video for ${participantName} (${participantId})`);
            
            // Check if element already exists
            const existingElement = document.querySelector(`.video-wrapper[data-user-id="${participantId}"]`);
            if (existingElement) {
                console.log(`Video element for ${participantId} already exists, updating`);
                return;
            }
            
            // Create video element
            const videoElement = document.createElement('video');
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.classList.add('video-item');
            
            // Create video wrapper
            const videoWrapper = document.createElement('div');
            videoWrapper.classList.add('video-wrapper');
            videoWrapper.dataset.userId = participantId;
            
            // Create name tag
            const nameTag = document.createElement('div');
            nameTag.classList.add('video-name-tag');
            nameTag.textContent = participantName;
            
            // Create media indicators
            const audioIndicator = document.createElement('div');
            audioIndicator.classList.add('media-indicator', 'audio-indicator');
            audioIndicator.innerHTML = `<i class="fas ${participantData.hasAudio ? 'fa-microphone' : 'fa-microphone-slash'}"></i>`;
            
            const videoIndicator = document.createElement('div');
            videoIndicator.classList.add('media-indicator', 'video-indicator');
            videoIndicator.innerHTML = `<i class="fas ${participantData.hasVideo ? 'fa-video' : 'fa-video-slash'}"></i>`;
            
            // Create connection quality indicator
            const qualityIndicator = document.createElement('div');
            qualityIndicator.classList.add('connection-quality');
            qualityIndicator.innerHTML = '<i class="fas fa-signal"></i>';
            
            // Add elements to wrapper
            videoWrapper.appendChild(videoElement);
            videoWrapper.appendChild(nameTag);
            videoWrapper.appendChild(audioIndicator);
            videoWrapper.appendChild(videoIndicator);
            videoWrapper.appendChild(qualityIndicator);
            
            // Add to video container
            const videoContainer = document.getElementById('video-container');
            if (videoContainer) {
                videoContainer.appendChild(videoWrapper);
            } else {
                console.error("Video container not found");
            }
            
            // Create placeholder if video is disabled
            if (!participantData.hasVideo) {
                const placeholder = document.createElement('div');
                placeholder.classList.add('video-placeholder');
                placeholder.textContent = participantName.charAt(0).toUpperCase();
                videoElement.style.display = 'none';
                videoWrapper.insertBefore(placeholder, videoElement.nextSibling);
            }
            
            // If we already have a stream for this participant, set it
            if (remoteStreams[participantId]) {
                videoElement.srcObject = remoteStreams[participantId];
            }
            
            // Add click handler for fullscreen toggle
            videoWrapper.addEventListener('click', () => {
                toggleFullscreen(videoWrapper);
            });
        })
        .catch(error => {
            console.error(`Error getting participant data for ${participantId}:`, error);
        });
}

// Toggle fullscreen for a video element
function toggleFullscreen(videoWrapper) {
    if (!videoWrapper) return;
    
    if (videoWrapper.classList.contains('fullscreen')) {
        // Exit fullscreen
        videoWrapper.classList.remove('fullscreen');
        
        // Restore original position in the grid
        const videoContainer = document.getElementById('video-container');
        if (videoContainer) {
            videoContainer.appendChild(videoWrapper);
        }
    } else {
        // Enter fullscreen
        videoWrapper.classList.add('fullscreen');
        document.body.appendChild(videoWrapper);
    }
}

// Update connection quality indicator
function updateConnectionQualityIndicator(participantId, state) {
    const qualityIndicator = document.querySelector(`.video-wrapper[data-user-id="${participantId}"] .connection-quality`);
    if (!qualityIndicator) return;
    
    // Remove existing quality classes
    qualityIndicator.classList.remove(
        'quality-excellent', 'quality-good', 'quality-fair', 'quality-poor', 'quality-bad'
    );
    
    // Add appropriate class based on connection state
    switch (state) {
        case 'connected':
            qualityIndicator.classList.add('quality-excellent');
            qualityIndicator.title = 'Excellent connection';
            break;
        case 'completed':
            qualityIndicator.classList.add('quality-good');
            qualityIndicator.title = 'Good connection';
            break;
        case 'checking':
            qualityIndicator.classList.add('quality-fair');
            qualityIndicator.title = 'Connecting...';
            break;
        case 'disconnected':
            qualityIndicator.classList.add('quality-poor');
            qualityIndicator.title = 'Poor connection';
            break;
        case 'failed':
            qualityIndicator.classList.add('quality-bad');
            qualityIndicator.title = 'Connection failed';
            break;
        default:
            qualityIndicator.title = 'Unknown connection state';
    }
}

// Handle WebRTC signaling message
function handleSignal(signal) {
    const senderId = signal.from;
    
    if (!senderId) {
        console.error("Received signal without sender ID");
        return;
    }
    
    console.log(`Processing ${signal.type} signal from ${senderId}`);
    
    switch (signal.type) {
        case 'offer':
            handleOffer(senderId, signal.sdp);
            break;
            
        case 'answer':
            handleAnswer(senderId, signal.sdp);
            break;
            
        case 'ice-candidate':
            handleIceCandidate(senderId, signal.candidate);
            break;
            
        default:
            console.warn(`Unknown signal type: ${signal.type}`);
    }
}

// Handle WebRTC offer
function handleOffer(senderId, sdp) {
    console.log(`Handling offer from ${senderId}`);
    
    // Create peer connection if it doesn't exist
    const peerConnection = createPeerConnection(senderId, false);
    
    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
        .then(() => {
            console.log(`Remote description set for ${senderId}, creating answer`);
            return peerConnection.createAnswer();
        })
        .then(answer => {
            console.log(`Setting local description for ${senderId}`);
            return peerConnection.setLocalDescription(answer);
        })
        .then(() => {
            console.log(`Sending answer to ${senderId}`);
            sendSignal(senderId, {
                type: 'answer',
                sdp: peerConnection.localDescription
            });
        })
        .catch(error => {
            console.error(`Error handling offer from ${senderId}:`, error);
        });
}

// Handle WebRTC answer
function handleAnswer(senderId, sdp) {
    console.log(`Handling answer from ${senderId}`);
    
    const peerConnection = peerConnections[senderId];
    
    if (!peerConnection) {
        console.error(`No peer connection found for ${senderId}`);
        return;
    }
    
    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
        .then(() => {
            console.log(`Remote description set for ${senderId} from answer`);
        })
        .catch(error => {
            console.error(`Error setting remote description for ${senderId}:`, error);
        });
}

// Handle ICE candidate
function handleIceCandidate(senderId, candidate) {
    console.log(`Handling ICE candidate from ${senderId}`);
    
    const peerConnection = peerConnections[senderId];
    
    if (!peerConnection) {
        console.warn(`No peer connection found for ${senderId}, storing candidate for later`);
        
        // Store the candidate for later use
        if (!pendingICECandidates[senderId]) {
            pendingICECandidates[senderId] = [];
        }
        
        pendingICECandidates[senderId].push(candidate);
        return;
    }
    
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => {
            console.log(`ICE candidate added for ${senderId}`);
        })
        .catch(error => {
            console.error(`Error adding ICE candidate for ${senderId}:`, error);
        });
}

// Send WebRTC signaling message
function sendSignal(recipientId, signal) {
    if (!isFirebaseInitialized || !meetingID) {
        console.error("Cannot send signal: Firebase not initialized or no meeting ID");
        return;
    }
    
    signal.from = currentUser.id;
    signal.timestamp = firebase.database.ServerValue.TIMESTAMP;
    
    console.log(`Sending ${signal.type} signal to ${recipientId}`);
    
    db.ref(`meetings/${meetingID}/signals/${recipientId}`).push(signal)
        .catch(error => {
            console.error(`Error sending signal to ${recipientId}:`, error);
        });
}

// Close and clean up peer connection
function closePeerConnection(participantId) {
    console.log(`Closing peer connection with ${participantId}`);
    
    // Close peer connection
    if (peerConnections[participantId]) {
        peerConnections[participantId].close();
        delete peerConnections[participantId];
    }
    
    // Remove remote stream
    if (remoteStreams[participantId]) {
        delete remoteStreams[participantId];
    }
    
    // Remove video element
    const videoWrapper = document.querySelector(`.video-wrapper[data-user-id="${participantId}"]`);
    if (videoWrapper) {
        videoWrapper.remove();
    }
}
// Create peer connection to another participant
function createPeerConnection(participantId, isInitiator) {
    console.log(`Creating ${isInitiator ? 'initiator' : 'receiver'} peer connection to ${participantId}`);
    
    // Check if connection already exists
    if (peerConnections[participantId]) {
        console.log(`Connection to ${participantId} already exists, reusing`);
        return peerConnections[participantId];
    }
    
    // Create new RTCPeerConnection
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnections[participantId] = peerConnection;
    
    // Add local stream tracks to the connection
    if (localStream) {
        localStream.getTracks().forEach(track => {
            console.log(`Adding ${track.kind} track to connection with ${participantId}`);
            peerConnection.addTrack(track, localStream);
        });
    } else {
        console.warn(`No local stream available when connecting to ${participantId}`);
    }
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log(`Generated ICE candidate for connection with ${participantId}`);
            sendSignal(participantId, {
                type: 'ice-candidate',
                candidate: event.candidate
            });
        } else {
            console.log(`ICE candidate gathering completed for ${participantId}`);
        }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${participantId} changed to: ${peerConnection.connectionState}`);
        
        // Clean up failed connections
        if (peerConnection.connectionState === 'failed' || 
            peerConnection.connectionState === 'closed') {
            console.warn(`Connection to ${participantId} ${peerConnection.connectionState}, cleaning up`);
            closePeerConnection(participantId);
            
            // Try to reconnect after a delay if participant is still online
            setTimeout(() => {
                db.ref(`meetings/${meetingID}/participants/${participantId}`).once('value')
                    .then(snapshot => {
                        if (snapshot.exists() && snapshot.val().isOnline) {
                            console.log(`Attempting to reconnect to ${participantId}`);
                            createPeerConnection(participantId, true);
                        }
                    });
            }, 2000);
        }
    };
    
    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state with ${participantId} changed to: ${peerConnection.iceConnectionState}`);
        
        // Update UI to show connection quality
        updateConnectionQualityIndicator(participantId, peerConnection.iceConnectionState);
    };
    
    // Handle tracks from remote peer
    peerConnection.ontrack = (event) => {
        console.log(`Received ${event.track.kind} track from ${participantId}`);
        
        // Create or update remote stream
        if (!remoteStreams[participantId]) {
            remoteStreams[participantId] = new MediaStream();
            createRemoteVideoElement(participantId);
        }
        
        // Add the track to the remote stream
        remoteStreams[participantId].addTrack(event.track);
        
        // Update the video element with the stream
        const remoteVideo = document.querySelector(`.video-wrapper[data-user-id="${participantId}"] video`);
        if (remoteVideo) {
            remoteVideo.srcObject = remoteStreams[participantId];
        }
    };
    
    // If we're the initiator, create and send an offer
    if (isInitiator) {
        console.log(`Creating offer for ${participantId}`);
        
        peerConnection.createOffer()
            .then(offer => {
                console.log(`Setting local description for ${participantId}`);
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                console.log(`Sending offer to ${participantId}`);
                sendSignal(participantId, {
                    type: 'offer',
                    sdp: peerConnection.localDescription
                });
            })
            .catch(error => {
                console.error(`Error creating/sending offer to ${participantId}:`, error);
            });
    }
    
    // If we have pending ICE candidates for this peer, add them now
    if (pendingICECandidates[participantId]) {
        console.log(`Adding ${pendingICECandidates[participantId].length} pending ICE candidates for ${participantId}`);
        
        pendingICECandidates[participantId].forEach(candidate => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(error => {
                    console.error(`Error adding pending ICE candidate for ${participantId}:`, error);
                });
        });
        
        delete pendingICECandidates[participantId];
    }
    
    return peerConnection;
}

// Connect to participants (WebRTC)
function connectToParticipants() {
    console.log("Connecting to participants via WebRTC");
    
    if (!localStream) {
        console.error("Cannot connect to participants: No local stream available");
        return;
    }
    
    // Save references to tracks for later use
    localVideoTrack = localStream.getVideoTracks()[0];
    localAudioTrack = localStream.getAudioTracks()[0];
    
    // Set up WebRTC listeners for signaling
    setupWebRTCListeners();
}


// Add this to make sure the window closing triggers cleanup
window.addEventListener('beforeunload', function(e) {
    console.log("Window closing, performing cleanup");
    
    // Leave the meeting gracefully
    if (meetingID && currentUser.id && isFirebaseInitialized) {
        try {
            // Synchronous update to ensure it happens before page unloads
            const updates = {};
            updates[`meetings/${meetingID}/participants/${currentUser.id}/isOnline`] = false;
            updates[`meetings/${meetingID}/participants/${currentUser.id}/leftAt`] = firebase.database.ServerValue.TIMESTAMP;
            firebase.database().ref().update(updates);
        } catch (error) {
            console.error("Error updating online status on page unload:", error);
        }
    }
    
    // Stop all streams
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
    }
});

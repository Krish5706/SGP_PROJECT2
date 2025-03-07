// WebRTC configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.google.com:19302' },
        { urls: 'stun:stun2.google.com:19302' }
    ]
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

// Initialize meeting room when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing meeting room...");
    initMeetingRoom();
    
    // Set up UI event listeners
    setupEventListeners();
});

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
    
    // Connect to Firebase
    connectToMeeting();
    
    // Update connection status
    updateConnectionStatus(true);
}

// Set up UI event listeners
function setupEventListeners() {
    // Control buttons
    const micToggle = document.getElementById('mic-toggle');
    const camToggle = document.getElementById('cam-toggle');
    const screenShareToggle = document.getElementById('screen-share-toggle');
    const participantsToggle = document.getElementById('participants-toggle');
    const chatToggle = document.getElementById('chat-toggle');
    const whiteboardToggle = document.getElementById('whiteboard-toggle');
    const endCallBtn = document.getElementById('end-call');
    const copyMeetingInfoBtn = document.getElementById('copy-meeting-info');
    const reactionToggle = document.getElementById('reaction-toggle');

    // Chat elements
    const sendMessageBtn = document.getElementById('send-message');
    const chatInput = document.getElementById('chat-input');

    // Add event listeners
    if (micToggle) micToggle.addEventListener('click', toggleMicrophone);
    if (camToggle) camToggle.addEventListener('click', toggleCamera);
    if (screenShareToggle) screenShareToggle.addEventListener('click', toggleScreenShare);
    
    if (endCallBtn) {
        endCallBtn.addEventListener('click', function() {
            endMeeting();
        });
    }
    
    if (copyMeetingInfoBtn) copyMeetingInfoBtn.addEventListener('click', copyMeetingInfo);
    
    // Panels toggle
    if (participantsToggle) participantsToggle.addEventListener('click', toggleParticipantsPanel);
    if (chatToggle) chatToggle.addEventListener('click', toggleChatPanel);
    if (whiteboardToggle) whiteboardToggle.addEventListener('click', toggleWhiteboard);

    // Reaction functionality
    if (reactionToggle) reactionToggle.addEventListener('click', toggleReactionPanel);
    
    // Set up reaction buttons
    setupReactionButtons();

    // Chat functionality
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendChatMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    // Close buttons for panels
    const closeParticipants = document.getElementById('close-participants');
    const closeChat = document.getElementById('close-chat');
    const closeWhiteboard = document.getElementById('close-whiteboard');
    
    if (closeParticipants) closeParticipants.addEventListener('click', () => togglePanel('participants-panel', false));
    if (closeChat) closeChat.addEventListener('click', () => togglePanel('chat-panel', false));
    if (closeWhiteboard) closeWhiteboard.addEventListener('click', () => togglePanel('whiteboard-container', false));
}

// Start local media stream
function startLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            const localVideo = document.createElement('video');
            localVideo.srcObject = stream;
            localVideo.autoplay = true;
            localVideo.muted = true; // Mute the local video to prevent feedback
            localVideo.classList.add('video-item');

            const videoWrapper = document.createElement('div');
            videoWrapper.classList.add('video-wrapper');
            videoWrapper.dataset.userId = currentUser.id;

            const nameTag = document.createElement('div');
            nameTag.classList.add('video-name-tag');
            nameTag.textContent = currentUser.name + ' (You)';

            videoWrapper.appendChild(localVideo);
            videoWrapper.appendChild(nameTag);
            document.getElementById('video-container').appendChild(videoWrapper);

            // Create peer connection for each participant
            connectToParticipants();
        })
        .catch(error => {
            console.error("Error accessing media devices.", error);
            alert("Could not access camera or microphone. Please check permissions.");
        });
}

// Connect to Firebase and set up listeners
function connectToMeeting() {
    if (!meetingID) return;

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
                hasVideo: true
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
    if (firebaseListenersActive) return;

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
    db.ref(`meetings/${meetingID}/participants/${currentUser.id}/isOnline`).onDisconnect().set(false);

    firebaseListenersActive = true;
}

// Toggle Microphone
function toggleMicrophone() {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;

    const micToggle = document.getElementById('mic-toggle');
    if (micToggle) {
        micToggle.innerHTML = `<i class="fas ${audioTrack.enabled ? 'fa-microphone' : 'fa-microphone-slash'}"></i>`;
    }

    // Update status in Firebase
    updateParticipantAudioStatus(audioTrack.enabled);
}

// Toggle Camera
function toggleCamera() {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;

    const camToggle = document.getElementById('cam-toggle');
    if (camToggle) {
        camToggle.innerHTML = `<i class="fas ${videoTrack.enabled ? 'fa-video' : 'fa-video-slash'}"></i>`;
    }

    // Update status in Firebase
    updateParticipantVideoStatus(videoTrack.enabled);
}

// Update participant audio status in Firebase
function updateParticipantAudioStatus(isEnabled) {
    if (meetingID && currentUser.id) {
        db.ref(`meetings/${meetingID}/participants/${currentUser.id}`).update({
            hasAudio: isEnabled
        });
    }
}

// Update participant video status in Firebase
function updateParticipantVideoStatus(isEnabled) {
    if (meetingID && currentUser.id) {
        db.ref(`meetings/${meetingID}/participants/${currentUser.id}`).update({
            hasVideo: isEnabled
        });
    }
}

// Send chat message to Firebase
function sendChatMessage() {
    const messageInput = document.getElementById('chat-input');
    if (!messageInput || messageInput.value.trim() === "") return;

    const message = {
        userId: currentUser.id,
        userName: currentUser.name,
        text: messageInput.value,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref(`meetings/${meetingID}/messages`).push(message)
        .then(() => {
            messageInput.value = ""; // Clear input field
        })
        .catch(error => {
            console.error("Error sending message:", error);
        });
}

// Display chat message in the chat area
function displayChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
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
}

// End meeting or leave meeting
function endMeeting() {
    console.log("endMeeting function called");
    
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
        }
    }
}

// Direct redirect - last resort when other methods fail
function directRedirect() {
    console.log("Using direct redirect to main.html");
    window.location.replace("main.html");
    
    // Last resort fallback with timeout
    setTimeout(() => {
        window.open("main.html", "_self");
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
    if (firebaseListenersActive) {
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
    const meetingLink = `${window.location.origin}/meetingroom.html?id=${meetingID}`;
    const copyText = `Meeting ID: ${meetingID}\nMeeting Link: ${meetingLink}`;
    
    // Create a temporary textarea to copy text
    const textarea = document.createElement("textarea");
    textarea.value = copyText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    
    // Show feedback
    const button = document.getElementById("copy-meeting-info");
    if (button) {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
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
    const participantsList = document.getElementById("participants-list");
    const participantCount = document.getElementById("participant-count");

    if (!participantsList || !participantCount) return;

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
    const connectionStatus = document.getElementById('connection-status');
    if (!connectionStatus) return;
    
    const statusIndicator = connectionStatus.querySelector('.status-indicator');

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
    if (!panel) return;
    
    if (show === undefined) {
        // Toggle visibility
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    } else {
        // Set visibility explicitly
        panel.style.display = show ? 'block' : 'none';
    }
}

function toggleParticipantsPanel() {
    togglePanel('participants-panel');
    document.getElementById('participants-toggle').classList.toggle('active');
}

function toggleChatPanel() {
    togglePanel('chat-panel');
    document.getElementById('chat-toggle').classList.toggle('active');
}

// Toggle whiteboard visibility
function toggleWhiteboard() {
    const whiteboardContainer = document.getElementById('whiteboard-container');
    if (!whiteboardContainer) return;
    
    isWhiteboardActive = !isWhiteboardActive;
    
    if (isWhiteboardActive) {
        whiteboardContainer.style.display = 'flex'; // Use flex instead of block
        document.getElementById('whiteboard-toggle').classList.add('active');
        
        // Initialize whiteboard after making it visible
        setTimeout(() => {
            initWhiteboard();
        }, 100); // Short delay to ensure the container is visible first
    } else {
        whiteboardContainer.style.display = 'none';
        document.getElementById('whiteboard-toggle').classList.remove('active');
    }
}

// REACTION FUNCTIONALITY
// -----------------------

// Toggle reaction panel
function toggleReactionPanel() {
    const reactionPanel = document.getElementById('reaction-panel');
    if (!reactionPanel) return;
    
    isReactionPanelVisible = !isReactionPanelVisible;
    reactionPanel.style.display = isReactionPanelVisible ? 'flex' : 'none';
    document.getElementById('reaction-toggle').classList.toggle('active', isReactionPanelVisible);
}

// Setup reaction buttons
function setupReactionButtons() {
    const reactionButtons = document.querySelectorAll('.reaction-btn');
    
    reactionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const emoji = button.getAttribute('data-emoji');
            if (emoji) {
                sendReaction(emoji);
                toggleReactionPanel(); // Hide panel after selecting
            }
        });
    });
}

// Send reaction to Firebase
function sendReaction(emoji) {
    if (!meetingID || !currentUser.id) return;
    
    const reaction = {
        userId: currentUser.id,
        userName: currentUser.name,
        emoji: emoji,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    db.ref(`meetings/${meetingID}/reactions`).push(reaction)
        .catch(error => {
            console.error("Error sending reaction:", error);
        });
}

// Display reaction on screen with enhanced animation
function displayReaction(reaction) {
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
    if (!videoContainer) return;
    
    const containerRect = videoContainer.getBoundingClientRect();
    
    // Position reaction horizontally at a random position
    const posX = Math.random() * (containerRect.width - 80) + 40; // Keep away from edges
    
    // Start from bottom of the container
    reactionContainer.style.left = `${posX}px`;
    reactionContainer.style.bottom = '0';
    
    // Start animation
    reactionContainer.classList.add('animated-reaction');
    
    // Append to container
    videoContainer.appendChild(reactionContainer);
    
    // Remove after a set duration
    setTimeout(() => {
        reactionContainer.remove();
    }, 4000);
}

// Connect to participants (WebRTC)
function connectToParticipants() {
    // This would implement the WebRTC peer connection logic
    console.log("WebRTC connection functionality would be implemented here");
}

// Add function to initialize whiteboard if not present
function initializeWhiteboard() {
    if (typeof initWhiteboard === 'function') {
        initWhiteboard();
    } else {
        console.log("Whiteboard functionality not available");
    }
}

// For testing - add emergency button if no end call button is found
document.addEventListener('DOMContentLoaded', function() {
    // Check after a short delay to make sure DOM is fully loaded
    setTimeout(() => {
        if (!document.getElementById('end-call')) {
            console.warn("Creating emergency end call button");
            const emergencyButton = document.createElement('button');
            emergencyButton.id = 'emergency-end-call';
            emergencyButton.textContent = "EMERGENCY END";
            emergencyButton.style.cssText = "position: fixed; bottom: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px; border-radius: 5px; cursor: pointer;";
            emergencyButton.addEventListener('click', endMeeting);
            document.body.appendChild(emergencyButton);
        }
    }, 2000);
});

// Agora integration for video conferencing
let agoraClient = null;
let localAudioTrack = null;
let localVideoTrack = null;
let agoraScreenTrack = null;
let remoteUsers = {};
let appId = AGORA_CONFIG.APP_ID;

// Initialize Agora service
async function initializeAgora(meetingID, onUserJoined, onUserLeft) {
    console.log("Initializing Agora SDK for meeting:", meetingID);
    
    // Create Agora client
    agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // Set up event listeners
    agoraClient.on("user-published", async (user, mediaType) => {
        console.log(`User ${user.uid} published ${mediaType} track`);
        
        // Subscribe to the remote user
        await agoraClient.subscribe(user, mediaType);
        
        // Handle video/audio publication
        if (mediaType === "video") {
            // Store remote user
            remoteUsers[user.uid] = user;
            
            // Notify the app about the new user if not already known
            if (typeof onUserJoined === 'function') {
                onUserJoined(user);
            }
            
            // Create UI for this user's video
            createAgoraRemoteVideoElement(user);
        }
        
        if (mediaType === "audio") {
            // Play audio
            user.audioTrack.play();
            updateRemoteAudioStatus(user.uid, true);
        }
    });
    
    // Handle user unpublished event
    agoraClient.on("user-unpublished", (user, mediaType) => {
        console.log(`User ${user.uid} unpublished ${mediaType} track`);
        
        if (mediaType === "video") {
            // Update UI for video stopped
            updateRemoteVideoStatus(user.uid, false);
        } else if (mediaType === "audio") {
            updateRemoteAudioStatus(user.uid, false);
        }
    });
    
    // Handle user left event
    agoraClient.on("user-left", (user) => {
        console.log(`User ${user.uid} left the channel`);
        
        // Remove user from remote users
        delete remoteUsers[user.uid];
        
        // Remove user's video element
        removeAgoraRemoteVideoElement(user.uid);
        
        // Notify the app
        if (typeof onUserLeft === 'function') {
            onUserLeft(user);
        }
    });
    
    return true;
}

// Join Agora channel
async function joinChannel(meetingID, userID, userName, token = null) {
    if (!agoraClient) {
        console.error("Agora client not initialized");
        return false;
    }
    
    try {
        console.log(`Joining Agora channel: ${meetingID} as user: ${userID}`);
        
        // Join the channel
        await agoraClient.join(appId, meetingID, token, userID);
        
        // Create and publish audio/video tracks
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            const videoTrack = localStream.getVideoTracks()[0];
            
            if (audioTrack) {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                    microphoneId: audioTrack.getSettings().deviceId
                });
                await agoraClient.publish(localAudioTrack);
            }
            
            if (videoTrack) {
                localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                    cameraId: videoTrack.getSettings().deviceId
                });
                await agoraClient.publish(localVideoTrack);
            }
        } else {
            // If no existing localStream, create new tracks
            try {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localVideoTrack = await AgoraRTC.createCameraVideoTrack();
                
                // Publish tracks
                await agoraClient.publish([localAudioTrack, localVideoTrack]);
            } catch (err) {
                console.error("Error creating Agora tracks:", err);
                // Try audio only if video fails
                if (!localAudioTrack) {
                    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                    await agoraClient.publish([localAudioTrack]);
                }
            }
        }
        
        // Set user's display name in Firebase for all users to see
        updateUserMetadata(userID, userName);
        
        console.log("Successfully joined Agora channel");
        return true;
    } catch (error) {
        console.error("Error joining Agora channel:", error);
        return false;
    }
}

// Leave Agora channel
async function leaveChannel() {
    if (!agoraClient) {
        return;
    }
    
    try {
        // Close local tracks
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        
        if (localVideoTrack) {
            localVideoTrack.close();
            localVideoTrack = null;
        }
        
        if (agoraScreenTrack) {
            agoraScreenTrack.close();
            agoraScreenTrack = null;
        }
        
        // Leave the channel
        await agoraClient.leave();
        console.log("Left Agora channel successfully");
    } catch (error) {
        console.error("Error leaving Agora channel:", error);
    }
}

// Toggle camera
async function toggleAgoraCamera(enabled) {
    if (!localVideoTrack) {
        console.warn("No local video track to toggle");
        return false;
    }
    
    try {
        if (enabled === undefined) {
            enabled = !localVideoTrack.enabled;
        }
        
        localVideoTrack.setEnabled(enabled);
        console.log(`Camera ${enabled ? 'enabled' : 'disabled'}`);
        return enabled;
    } catch (error) {
        console.error("Error toggling camera:", error);
        return false;
    }
}

// Toggle microphone
async function toggleAgoraMicrophone(enabled) {
    if (!localAudioTrack) {
        console.warn("No local audio track to toggle");
        return false;
    }
    
    try {
        if (enabled === undefined) {
            enabled = !localAudioTrack.enabled;
        }
        
        localAudioTrack.setEnabled(enabled);
        console.log(`Microphone ${enabled ? 'enabled' : 'disabled'}`);
        return enabled;
    } catch (error) {
        console.error("Error toggling microphone:", error);
        return false;
    }
}

// Toggle screen sharing
async function toggleAgoraScreenShare() {
    try {
        if (agoraScreenTrack) {
            // Stop screen sharing
            await agoraClient.unpublish(agoraScreenTrack);
            agoraScreenTrack.close();
            agoraScreenTrack = null;
            console.log("Screen sharing stopped");
            return false; // Not sharing anymore
        } else {
            // Start screen sharing
            agoraScreenTrack = await AgoraRTC.createScreenVideoTrack();
            
            // Handle screen share stopped by browser UI
            agoraScreenTrack.on("track-ended", () => {
                console.log("Screen sharing stopped by system event");
                toggleAgoraScreenShare(); // This will clean up the track
            });
            
            // Publish screen track
            await agoraClient.publish(agoraScreenTrack);
            console.log("Screen sharing started");
            return true; // Now sharing
        }
    } catch (error) {
        console.error("Error toggling screen share:", error);
        if (error.message === 'Permission denied' || error.message.includes('Permission denied')) {
            alert("Screen sharing permission denied. Please allow access to your screen.");
        }
        return false;
    }
}

// Create UI for remote user video
function createAgoraRemoteVideoElement(user) {
    // Find if there's already a numeric-to-string user ID mapping
    let participantId = findParticipantIdByNumericId(user.uid);
    
    // If not found, we'll use the numeric ID directly
    if (!participantId) {
        participantId = user.uid.toString();
    }
    
    // Find existing element if any
    const existingWrapper = document.querySelector(`.video-wrapper[data-user-id="${participantId}"]`);
    
    if (existingWrapper) {
        // Update existing element
        const videoElement = existingWrapper.querySelector('video');
        if (videoElement && user.videoTrack) {
            user.videoTrack.play(videoElement);
        }
        return;
    }
    
    // Get user name from Firebase or other metadata source
    getUserDisplayName(participantId).then(userName => {
        // Create new video wrapper
        const videoWrapper = document.createElement('div');
        videoWrapper.classList.add('video-wrapper');
        videoWrapper.dataset.userId = participantId;
        videoWrapper.dataset.numericUid = user.uid.toString();
        
        // Create video element
        const videoElement = document.createElement('video');
        videoElement.classList.add('video-item');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        
        // Create name tag
        const nameTag = document.createElement('div');
        nameTag.classList.add('video-name-tag');
        nameTag.textContent = userName || `User ${participantId}`;
        
        // Create media indicators
        const audioIndicator = document.createElement('div');
        audioIndicator.classList.add('media-indicator', 'audio-indicator');
        audioIndicator.innerHTML = `<i class="fas fa-microphone"></i>`;
        
        const videoIndicator = document.createElement('div');
        videoIndicator.classList.add('media-indicator', 'video-indicator');
        videoIndicator.innerHTML = `<i class="fas fa-video"></i>`;
        
        // Create connection quality indicator
        const qualityIndicator = document.createElement('div');
        qualityIndicator.classList.add('connection-quality', 'quality-excellent');
        qualityIndicator.innerHTML = '<i class="fas fa-signal"></i>';
        qualityIndicator.title = 'Connected via Agora';
        
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
            
            // Play the video track
            if (user.videoTrack) {
                user.videoTrack.play(videoElement);
            } else {
                // Create placeholder if video track not available
                const placeholder = document.createElement('div');
                placeholder.classList.add('video-placeholder');
                placeholder.textContent = (userName || `User ${participantId}`).charAt(0).toUpperCase();
                videoElement.style.display = 'none';
                videoWrapper.insertBefore(placeholder, videoElement.nextSibling);
            }
            
            // Add click handler for fullscreen toggle
            videoWrapper.addEventListener('click', () => {
                toggleFullscreen(videoWrapper);
            });
        }
    });
}

// Update remote video status
function updateRemoteVideoStatus(uid, isVideoEnabled) {
    // Find the participant ID from numeric UID
    let participantId = findParticipantIdByNumericId(uid);
    if (!participantId) {
        participantId = uid.toString();
    }
    
    const videoWrapper = document.querySelector(`.video-wrapper[data-user-id="${participantId}"]`) || 
                         document.querySelector(`.video-wrapper[data-numeric-uid="${uid}"]`);
    if (!videoWrapper) return;
    
    const videoElement = videoWrapper.querySelector('video');
    const videoIndicator = videoWrapper.querySelector('.video-indicator');
    
    if (isVideoEnabled) {
        // Video is enabled
        if (videoElement) videoElement.style.display = 'block';
        
        // Remove placeholder if exists
        const placeholder = videoWrapper.querySelector('.video-placeholder');
        if (placeholder) placeholder.remove();
        
        // Update indicator
        if (videoIndicator) {
            videoIndicator.innerHTML = '<i class="fas fa-video"></i>';
        }
    } else {
        // Video is disabled
        if (videoElement) videoElement.style.display = 'none';
        
        // Show placeholder if not already exists
        if (!videoWrapper.querySelector('.video-placeholder')) {
            const userName = videoWrapper.querySelector('.video-name-tag')?.textContent || `User ${participantId}`;
            const placeholder = document.createElement('div');
            placeholder.classList.add('video-placeholder');
            placeholder.textContent = userName.charAt(0).toUpperCase();
            videoWrapper.insertBefore(placeholder, videoElement?.nextSibling || videoWrapper.firstChild);
        }
        
        // Update indicator
        if (videoIndicator) {
            videoIndicator.innerHTML = '<i class="fas fa-video-slash"></i>';
        }
    }
}

// Update remote audio status
function updateRemoteAudioStatus(uid, isAudioEnabled) {
    // Find the participant ID from numeric UID
    let participantId = findParticipantIdByNumericId(uid);
    if (!participantId) {
        participantId = uid.toString();
    }
    
    const videoWrapper = document.querySelector(`.video-wrapper[data-user-id="${participantId}"]`) || 
                         document.querySelector(`.video-wrapper[data-numeric-uid="${uid}"]`);
    if (!videoWrapper) return;
    
    const audioIndicator = videoWrapper.querySelector('.audio-indicator');
    if (audioIndicator) {
        audioIndicator.innerHTML = `<i class="fas fa-microphone${isAudioEnabled ? '' : '-slash'}"></i>`;
    }
}

// Remove remote video element
function removeAgoraRemoteVideoElement(uid) {
    // Find the participant ID from numeric UID
    let participantId = findParticipantIdByNumericId(uid);
    if (!participantId) {
        participantId = uid.toString();
    }
    
    const videoWrapper = document.querySelector(`.video-wrapper[data-user-id="${participantId}"]`) || 
                         document.querySelector(`.video-wrapper[data-numeric-uid="${uid}"]`);
    if (videoWrapper) {
        videoWrapper.remove();
    }
}

// Helper to find participant ID by numeric Agora UID
function findParticipantIdByNumericId(numericUid) {
    // Check if we have a string-to-numeric mapping
    if (typeof numericUid === 'number' || typeof numericUid === 'string') {
        const allWrappers = document.querySelectorAll('.video-wrapper[data-numeric-uid]');
        for (const wrapper of allWrappers) {
            if (wrapper.dataset.numericUid === numericUid.toString()) {
                return wrapper.dataset.userId;
            }
        }
    }
    return null;
}

// Get user display name from Firebase
async function getUserDisplayName(uid) {
    // Try to get from participants list in Firebase
    if (meetingID && isFirebaseInitialized) {
        try {
            const snapshot = await db.ref(`meetings/${meetingID}/participants/${uid}`).once('value');
            if (snapshot.exists()) {
                return snapshot.val().name || `User ${uid}`;
            }
        } catch (error) {
            console.error("Error getting user display name:", error);
        }
    }
    
    return `User ${uid}`;
}

// Update user metadata in Firebase
function updateUserMetadata(uid, userName) {
    if (meetingID && isFirebaseInitialized) {
        try {
            db.ref(`meetings/${meetingID}/participants/${uid}`).update({
                name: userName,
                agoraUID: uid
            });
        } catch (error) {
            console.error("Error updating user metadata:", error);
        }
    }
}

//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"})

//#2
let config = {
    appid: '4d4d7cbbe8664bf4b5490ca3bc6a464e',
    token: '007eJxTYDCWn5XrK+q24FDGgZ3G2wTWa9qG7hEyMamvmXbHWJZT67kCg0mKSYp5clJSqoWZmUlSmkmSqYmlQXKicVKyWaKJmUmqWzVPRkMgI8NSJk8GRigE8VkYchMz8xgYAFWmG7w=',
    uid:null,
    channel: 'main',
}

//#3 - Setting tracks for when user joins
let localTracks = {
    audioTrack:null,
    videoTrack:null
}

//#4 - Want to hold state for users audio and video so user can mute and hide
let localTrackState = {
    audioTrackMuted:false,
    videoTrackMuted:false
}

//#5 - Set remote tracks to store other users
let remoteTracks = {}

document.getElementById('join-btn').addEventListener('click', async () => {
    config.uid = document.getElementById('username').value
    await joinStreams()
    document.getElementById('join-wrapper').style.display = 'none'
    document.getElementById('footer').style.display = 'flex'
})

document.getElementById('mic-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.audioTrackMuted){
        //Mute your audio
        await localTracks.audioTrack.setMuted(true);
        localTrackState.audioTrackMuted = true
        document.getElementById('mic-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
    }else{
        await localTracks.audioTrack.setMuted(false)
        localTrackState.audioTrackMuted = false
        document.getElementById('mic-btn').style.backgroundColor ='#1f1f1f8e'

    }
})

document.getElementById('camera-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.videoTrackMuted){
        //Mute your audio
        await localTracks.videoTrack.setMuted(true);
        localTrackState.videoTrackMuted = true
        document.getElementById('camera-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
    }else{
        await localTracks.videoTrack.setMuted(false)
        localTrackState.videoTrackMuted = false
        document.getElementById('camera-btn').style.backgroundColor ='#1f1f1f8e'

    }
})

document.getElementById('leave-btn').addEventListener('click', async () => {
    //Loop threw local tracks and stop them so unpublish event gets triggered, then set to undefined
    //Hide footer
    for (trackName in localTracks){
        let track = localTracks[trackName]
        if(track){
            track.stop()
            track.close()
            localTracks[trackName] = null
        }
    }

    //Leave the channel
    await client.leave()
    document.getElementById('footer').style.display = 'none'
    document.getElementById('user-streams').innerHTML = ''
    document.getElementById('join-wrapper').style.display = 'block'

})

//Method will take all my info and set user stream in frame
let joinStreams = async () => {
    //Is this place hear strategicly or can I add to end of method?
    
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);


    client.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if(volume > 0){
                document.getElementById(`volume-${speaker}`).src = './assets/volume-on.svg'
            }else{
                document.getElementById(`volume-${speaker}`).src = './assets/volume-off.svg'
            }  
        }
    });

    //#6 - Set and get back tracks for local user
    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
        client.join(config.appid, config.channel, config.token ||null, config.uid ||null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()

    ])
    
    //#7 - Create player and add it to player list
    let player = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${config.uid}" src="./assets/volume-on.svg" /> ${config.uid}</p>
                        <div class="video-player player" id="stream-${config.uid}"></div>
                  </div>`

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
    //#8 - Player user stream in div
    localTracks.videoTrack.play(`stream-${config.uid}`)
    

    //#9 Add user to user list of names/ids

    //#10 - Publish my local video tracks to entire channel so everyone can see it
    await client.publish([localTracks.audioTrack, localTracks.videoTrack])

}

let handleUserJoined = async (user, mediaType) => {
    console.log('Handle user joined')

    //#11 - Add user to list of remote users
    remoteTracks[user.uid] = user

    //#12 Subscribe ro remote users
    await client.subscribe(user, mediaType)
   
    
    if (mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`)
        console.log('player:', player)
        if (player != null){
            player.remove()
        }
 
        player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                      </div>`
        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
         user.videoTrack.play(`stream-${user.uid}`)    
    }
    

    if (mediaType === 'audio') {
        user.audioTrack.play();
      }
}

let handleUserLeft = (user) => {
    console.log('Handle user left!')
    //Remove from remote users and remove users video wrapper
    delete remoteTracks[user.uid]
    document.getElementById(`video-wrapper-${user.uid}`).remove()
}

// screen share button

let isScreenSharing = false;
let screenTrack = null;

document.getElementById('screen-share-btn').addEventListener('click', async () => {
    try {
        if (!isScreenSharing) {
            screenTrack = await AgoraRTC.createScreenVideoTrack();

            await client.unpublish(localTracks.videoTrack);
            localTracks.videoTrack.stop();

            await client.publish(screenTrack);
            screenTrack.play(`stream-${config.uid}`);

            isScreenSharing = true;
            document.getElementById('screen-share-btn').style.backgroundColor = 'rgb(0, 200, 255, 0.6)';

            screenTrack.on('track-ended', async () => {
                await stopScreenShare();
            });
        } else {
            await stopScreenShare();
        }
    } catch (err) {
        console.error('Screen share error:', err);
        alert('Screen sharing failed: ' + err.message);
    }
});

const stopScreenShare = async () => {
    if (!isScreenSharing || !screenTrack) return;

    await client.unpublish(screenTrack);
    screenTrack.stop();
    screenTrack.close();
    screenTrack = null;

    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
    await client.publish(localTracks.videoTrack);
    localTracks.videoTrack.play(`stream-${config.uid}`);

    isScreenSharing = false;
    document.getElementById('screen-share-btn').style.backgroundColor = '#1f1f1f8e';
}

// reaction button
// Dynamically create reaction elements while preserving HTML structure
document.addEventListener('DOMContentLoaded', function() {
    // Create the reactions wrapper and add it to the body
    const reactionsWrapper = document.createElement('div');
    reactionsWrapper.className = 'reactions-wrapper';
    reactionsWrapper.id = 'reactions-wrapper';
    document.body.appendChild(reactionsWrapper);
    
    // Create the reaction buttons container
    const reactionButtons = document.createElement('div');
    reactionButtons.className = 'reaction-buttons';
    reactionButtons.id = 'reaction-buttons';
    reactionsWrapper.appendChild(reactionButtons);
    
    // Define emoji reactions
    const emojis = ['👍', '👏', '❤️', '🎉', '😂', '🙌'];
    
    // Create buttons for each emoji
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'reaction-btn';
        button.dataset.emoji = emoji;
        button.textContent = emoji;
        reactionButtons.appendChild(button);
    });
    
    // Create emoji container for animations
    const emojiContainer = document.createElement('div');
    emojiContainer.className = 'emoji-container';
    document.body.appendChild(emojiContainer);
    
    // Reaction button click handler - toggle reaction panel
    document.getElementById('reaction-btn').addEventListener('click', function() {
        const reactionPanel = document.getElementById('reaction-buttons');
        
        if (reactionPanel.style.display === 'flex') {
            reactionPanel.style.display = 'none';
        } else {
            reactionPanel.style.display = 'flex';
        }
    });
    
    // Add click events to all reaction buttons
    document.querySelectorAll('.reaction-btn').forEach(button => {
        button.addEventListener('click', function() {
            const emoji = this.dataset.emoji;
            
            // Broadcast the reaction to other users
            broadcastReaction(emoji);
            
            // Hide the reaction panel after selection
            document.getElementById('reaction-buttons').style.display = 'none';
        });
    });
    
    // Add click event to document to close reaction panel when clicking elsewhere
    document.addEventListener('click', function(event) {
        const reactionsWrapper = document.getElementById('reactions-wrapper');
        const reactionBtn = document.getElementById('reaction-btn');
        
        if (!reactionsWrapper.contains(event.target) && event.target !== reactionBtn && !reactionBtn.contains(event.target)) {
            document.getElementById('reaction-buttons').style.display = 'none';
        }
    });
});

// Function to broadcast the reaction to other users
function broadcastReaction(emoji) {
    // Here you would implement the logic to send the emoji to other users
    // For example, using WebSocket or Agora's signaling
    console.log(`Broadcasting reaction: ${emoji}`);
    
    // Simulate sending the reaction to other users
    sendReactionToServer(emoji);
}

// Mock function to simulate sending the reaction to a server
function sendReactionToServer(emoji) {
    // Simulate receiving the reaction on other clients
    setTimeout(() => {
        receiveReaction(emoji);
    }, 1000); // Simulate network delay
}

// Function to receive and display the reaction
function receiveReaction(emoji) {
    // Create multiple emoji elements for a burst effect
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFloatingEmoji(emoji, document.querySelector('.emoji-container'));
        }, i * 150); // Stagger the creation
    }
}

// Function to create and animate a floating emoji
function createFloatingEmoji(emoji, container) {
    // Create emoji element
    const emojiElement = document.createElement('div');
    emojiElement.classList.add('emoji');
    emojiElement.textContent = emoji;
    
    // Random horizontal position
    const randomX = Math.random() * 80 + 10; // 10% to 90% of the width
    emojiElement.style.left = `${randomX}%`;
    
    // Add to container
    container.appendChild(emojiElement);
    
    // Remove the emoji after animation completes
    setTimeout(() => {
        emojiElement.remove();
    }, 2000); // Remove after 2 seconds (matches animation duration)
}

// Recording functionality

// Load the required libraries for MP4 conversion
document.addEventListener('DOMContentLoaded', function() {
    // Reference to the recording button
    const recordingBtn = document.querySelector('.icon-wrapper:nth-child(5) .control-icon');
    
    // Variables for recording state
    let isRecording = false;
    let mediaRecorder = null;
    let recordedChunks = [];
    let recordingStream = null;
    
    // Create recording indicator
    const recordingIndicator = document.createElement('div');
    recordingIndicator.className = 'recording-active';
    recordingIndicator.innerHTML = '<div class="recording-dot"></div><span>Recording...</span>';
    document.body.appendChild(recordingIndicator);
    
    // Create download notification
    const downloadNotification = document.createElement('div');
    downloadNotification.className = 'download-notification';
    downloadNotification.innerHTML = `
        <p>Recording complete!</p>
        <button class="download-btn">Save as MP4</button>
        <div class="processing-indicator" style="display:none;">Processing recording...</div>
    `;
    document.body.appendChild(downloadNotification);
    
    // Get the download button
    const downloadBtn = downloadNotification.querySelector('.download-btn');
    const processingIndicator = downloadNotification.querySelector('.processing-indicator');
    
    // Function to get supported MIME type for recording
    const getSupportedMimeType = () => {
        // Try MP4 format first
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            return 'video/mp4';
        }
        // Then try other formats that can be converted to MP4
        if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
            return 'video/webm;codecs=h264';
        }
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            return 'video/webm;codecs=vp9';
        }
        if (MediaRecorder.isTypeSupported('video/webm')) {
            return 'video/webm';
        }
        // Default fallback
        return '';
    };
    
    // Function to capture screen and audio
    const startCapture = async () => {
        try {
            // Create a canvas element for composition
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Get the video element dimensions from the local user's video
            const videoElement = document.getElementById(`stream-${config.uid}`);
            
            if (!videoElement) {
                throw new Error("Your video stream is not available");
            }
            
            // Set canvas dimensions to match video
            canvas.width = videoElement.clientWidth || 640;
            canvas.height = videoElement.clientHeight || 480;
            
            // Get audio track from microphone
            const audioTrack = localTracks.audioTrack ? 
                               localTracks.audioTrack.getMediaStreamTrack() : 
                               null;
            
            // Create a canvas stream
            const canvasStream = canvas.captureStream(30); // 30 FPS
            
            // Add audio track to canvas stream if available
            if (audioTrack) {
                canvasStream.addTrack(audioTrack);
            }
            
            // Recording function to draw video frame to canvas
            function drawVideoToCanvas() {
                if (isRecording && videoElement) {
                    // Draw current frame to canvas
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // If video element exists and is playing, draw it
                    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    }
                    
                    // Continue loop
                    requestAnimationFrame(drawVideoToCanvas);
                }
            }
            
            // Start the drawing loop
            drawVideoToCanvas();
            
            return canvasStream;
        } catch (error) {
            console.error("Error starting capture:", error);
            alert(`Failed to start recording: ${error.message}`);
            return null;
        }
    };
    
    // Start recording function
    const startRecording = async () => {
        try {
            // Get the stream to record
            recordingStream = await startCapture();
            
            if (!recordingStream) {
                throw new Error("Failed to create recording stream");
            }
            
            // Get supported MIME type
            const mimeType = getSupportedMimeType();
            
            // Create MediaRecorder with appropriate options
            const options = mimeType ? { mimeType } : {};
            mediaRecorder = new MediaRecorder(recordingStream, options);
            
            // Clear previous chunks
            recordedChunks = [];
            
            // Handle data available event
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            isRecording = true;
            
            // Update UI
            recordingBtn.classList.add('control-icon-active');
            recordingIndicator.style.display = 'flex';
            
            // Update button text and icon
            recordingBtn.src = './assets/stop-recording.svg';
            recordingBtn.parentElement.querySelector('p').textContent = 'Stop';
            
            console.log("Recording started successfully");
            
        } catch (error) {
            console.error("Error starting recording:", error);
            alert(`Could not start recording: ${error.message}`);
            isRecording = false;
        }
    };
    
    // Stop recording function
    const stopRecording = async () => {
        try {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                // Stop the media recorder
                mediaRecorder.stop();
                
                // Wait for the last data
                await new Promise(resolve => {
                    mediaRecorder.onstop = resolve;
                    // If it doesn't stop within 1 second, resolve anyway
                    setTimeout(resolve, 1000);
                });
            }
            
            // Stop all tracks in the recording stream
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }
            
            // Update state and UI
            isRecording = false;
            recordingBtn.classList.remove('control-icon-active');
            recordingIndicator.style.display = 'none';
            
            // Change button back
            recordingBtn.src = './assets/recording.svg';
            recordingBtn.parentElement.querySelector('p').textContent = 'Record';
            
            // Show download notification if we have data
            if (recordedChunks.length > 0) {
                downloadNotification.style.display = 'block';
                
                // Auto-hide after 30 seconds if not interacted with
                setTimeout(() => {
                    if (downloadNotification.style.display === 'block') {
                        downloadNotification.style.display = 'none';
                    }
                }, 30000);
            }
            
            console.log("Recording stopped successfully");
            
        } catch (error) {
            console.error("Error stopping recording:", error);
            alert(`Error stopping recording: ${error.message}`);
        }
    };
    
    // Toggle recording state
    const toggleRecording = async () => {
        if (!isRecording) {
            await startRecording();
        } else {
            await stopRecording();
        }
    };
    
    // Add click event to recording button
    recordingBtn.addEventListener('click', toggleRecording);
    
    // Download recording in MP4 format
    downloadBtn.addEventListener('click', async () => {
        if (recordedChunks.length === 0) {
            alert("No recording data available");
            return;
        }
        
        // Show processing message
        downloadBtn.disabled = true;
        processingIndicator.style.display = 'block';
        
        try {
            // Get recorded data MIME type
            const mimeType = getSupportedMimeType() || 'video/webm';
            
            // Create a blob from the recorded chunks
            const recordedBlob = new Blob(recordedChunks, { type: mimeType });
            
            // Create a URL for the blob
            const url = URL.createObjectURL(recordedBlob);
            
            // Create a download link
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = url;
            
            // Set the download file name with correct extension
            const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${fileExtension}`;
            
            // Trigger download
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                downloadNotification.style.display = 'none';
                downloadBtn.disabled = false;
                processingIndicator.style.display = 'none';
            }, 100);
            
        } catch (error) {
            console.error("Error saving recording:", error);
            alert(`Error saving recording: ${error.message}`);
            downloadBtn.disabled = false;
            processingIndicator.style.display = 'none';
        }
    });
    
    // Clean up when leaving the channel
    document.getElementById('leave-btn').addEventListener('click', async () => {
        if (isRecording) {
            await stopRecording();
        }
        downloadNotification.style.display = 'none';
    });
    
    // Close download notification if clicked outside
    document.addEventListener('click', (event) => {
        if (downloadNotification.style.display === 'block' && 
            !downloadNotification.contains(event.target) &&
            event.target !== recordingBtn) {
            downloadNotification.style.display = 'none';
        }
    });
});

// ==========================================

// participants button
// Participants panel functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create participants panel and add it to the body
    const participantsPanel = document.createElement('div');
    participantsPanel.className = 'participants-panel';
    participantsPanel.id = 'participants-panel';
    participantsPanel.innerHTML = `
        <div class="participants-header">
            <h2>Participants</h2>
            <button class="close-participants">×</button>
        </div>
        <div class="participants-list" id="participants-list"></div>
    `;
    document.body.appendChild(participantsPanel);

    // Get references
    const participantBtn = document.getElementById('paricipant-btn');
    const closeBtn = participantsPanel.querySelector('.close-participants');
    const participantsList = document.getElementById('participants-list');

    // Keep track of participants
    let participants = {};

    // Toggle participants panel
    participantBtn.addEventListener('click', function() {
        // Toggle panel visibility
        participantsPanel.classList.toggle('show');
        
        // Toggle active state on button
        if (participantsPanel.classList.contains('show')) {
            participantBtn.classList.add('control-icon-active');
            // Update participants list
            updateParticipantsList();
        } else {
            participantBtn.classList.remove('control-icon-active');
        }
    });

    // Close panel when close button is clicked
    closeBtn.addEventListener('click', function() {
        participantsPanel.classList.remove('show');
        participantBtn.classList.remove('control-icon-active');
    });

    // Close panel when clicking outside
    document.addEventListener('click', function(event) {
        if (!participantsPanel.contains(event.target) && 
            event.target !== participantBtn && 
            !participantBtn.contains(event.target) &&
            participantsPanel.classList.contains('show')) {
            participantsPanel.classList.remove('show');
            participantBtn.classList.remove('control-icon-active');
        }
    });

    // Function to update participants list
    function updateParticipantsList() {
        // Clear current list
        participantsList.innerHTML = '';
        
        // Add local user first
        if (config.uid) {
            const localUserItem = createParticipantItem(config.uid, true);
            participantsList.appendChild(localUserItem);
        }
        
        // Add remote users
        for (let uid in remoteTracks) {
            const participantItem = createParticipantItem(uid, false);
            participantsList.appendChild(participantItem);
        }
        
        // Update participant count in header
        const headerTitle = participantsPanel.querySelector('.participants-header h2');
        const count = Object.keys(remoteTracks).length + (config.uid ? 1 : 0);
        headerTitle.textContent = `Participants (${count})`;
    }

    // Create participant list item
    function createParticipantItem(uid, isLocal) {
        const item = document.createElement('div');
        item.className = `participant-item ${isLocal ? 'local-user' : ''}`;
        
        // Create initial for avatar
        const initial = uid.charAt(0).toUpperCase();
        
        // Create HTML structure
        item.innerHTML = `
            <div class="participant-info">
                <div class="participant-avatar">${initial}</div>
                <div class="participant-name">${uid} ${isLocal ? '(You)' : ''}</div>
            </div>
            <div class="participant-status">
                <img class="status-icon" src="./assets/volume-${isLocal && !localTrackState.audioTrackMuted ? 'on' : 'off'}.svg" />
                <img class="status-icon" src="./assets/videocam${isLocal && !localTrackState.videoTrackMuted ? '' : '-off'}.svg" />
            </div>
        `;
        
        return item;
    }

    // Add event listeners for user joined and left events
    client.on("user-published", function(user, mediaType) {
        // Update participants list if panel is visible
        if (participantsPanel.classList.contains('show')) {
            updateParticipantsList();
        }
    });

    client.on("user-left", function(user) {
        // Update participants list if panel is visible
        if (participantsPanel.classList.contains('show')) {
            updateParticipantsList();
        }
    });

    // Update participant status when local tracks change state
    document.getElementById('mic-btn').addEventListener('click', function() {
        if (participantsPanel.classList.contains('show')) {
            updateParticipantsList();
        }
    });

    document.getElementById('camera-btn').addEventListener('click', function() {
        if (participantsPanel.classList.contains('show')) {
            updateParticipantsList();
        }
    });

    // Update when volume indicator changes
    client.on("volume-indicator", function(evt) {
        if (!participantsPanel.classList.contains('show')) return;
        
        for (let i = 0; evt.length > i; i++) {
            const speaker = evt[i].uid;
            const volume = evt[i].level;
            
            // Find volume icon in participants panel
            const statusIcons = participantsList.querySelectorAll(`.participant-item .participant-status`);
            statusIcons.forEach(statusDiv => {
                const parentItem = statusDiv.closest('.participant-item');
                const participantName = parentItem.querySelector('.participant-name').textContent;
                
                if (participantName.includes(speaker)) {
                    const volumeIcon = statusDiv.querySelector('.status-icon:first-child');
                    volumeIcon.src = volume > 0 ? './assets/volume-on.svg' : './assets/volume-off.svg';
                }
            });
        }
    });
});
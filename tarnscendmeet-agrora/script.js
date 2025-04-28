//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"})

//#2
let config = {
    appid: '4d4d7cbbe8664bf4b5490ca3bc6a464e',
    token: '007eJxTYDB/fcT7iKitGudJ9/TldpUcX8+cb7l52iRSbKPUoRVvOVMUGExSTFLMk5OSUi3MzEyS0kySTE0sDZITjZOSzRJNzExSp8fwZzQEMjJkz25gZGSAQBCfhSE3MTOPgQEANVUfEQ==',
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

// ===========================================================================================================

// Recording functionality
// Add these variables at the top of your script.js file
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStream = null;

// Find the recording button in the DOM
const recordBtn = document.querySelector('#recording-btn[src="./assets/recording.svg"]');
// Get the leave button element to use its position for adding the stop recording button
const leaveBtn = document.querySelector('#leave-btn');

// Create stop recording button element (initially hidden)
const stopRecordBtn = document.createElement('img');
stopRecordBtn.className = 'control-icon';
stopRecordBtn.id = 'stop-record-btn';
stopRecordBtn.src = './assets/stop-recording.svg'; // Assuming you have this SVG
stopRecordBtn.style.display = 'none'; // Initially hidden
// Insert stop button next to the recording button's parent
recordBtn.parentElement.appendChild(stopRecordBtn);

// Add text element for the stop button
const stopRecordText = document.createElement('p');
stopRecordText.textContent = 'stop';
stopRecordText.style.display = 'none';
recordBtn.parentElement.appendChild(stopRecordText);

// Add event listeners
recordBtn.addEventListener('click', startRecording);
stopRecordBtn.addEventListener('click', stopRecording);

/**
 * Create an audio context to mix all audio streams
 */
let audioContext;
let audioDestination;
let audioSources = {};

/**
 * Initialize audio mixing for recording
 */
function initAudioMixing() {
  // Create audio context
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioDestination = audioContext.createMediaStreamDestination();
  
  // Add local audio track to the mix
  if (localTracks.audioTrack) {
    const audioStream = new MediaStream([localTracks.audioTrack.getMediaStreamTrack()]);
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(audioDestination);
    audioSources[config.uid] = source;
  }
  
  // Add all remote audio tracks to the mix
  for (const uid in remoteTracks) {
    const user = remoteTracks[uid];
    if (user.audioTrack) {
      const audioStream = new MediaStream([user.audioTrack._mediaStreamTrack]);
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(audioDestination);
      audioSources[uid] = source;
    }
  }
  
  // Add event listener for new users joining
  client.on("user-published", (user, mediaType) => {
    if (isRecording && mediaType === 'audio') {
      setTimeout(() => {
        if (user.audioTrack && !audioSources[user.uid]) {
          const audioStream = new MediaStream([user.audioTrack._mediaStreamTrack]);
          const source = audioContext.createMediaStreamSource(audioStream);
          source.connect(audioDestination);
          audioSources[user.uid] = source;
        }
      }, 1000); // Give time for the track to be fully available
    }
  });
}

/**
 * Start recording screen and all participants' audio
 */
async function startRecording() {
  try {
    // Create a canvas for compositing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match screen dimensions
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    
    // Get the screen capture stream
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        displaySurface: "browser"
      }
    });
    
    // Initialize audio mixing
    initAudioMixing();
    
    // Create a combined stream with screen video and mixed audio
    const videoTrack = screenStream.getVideoTracks()[0];
    const mixedAudioStream = audioDestination.stream;
    recordingStream = new MediaStream([videoTrack, ...mixedAudioStream.getTracks()]);
    
    // Check for supported formats
    const mimeType = checkBrowserSupport();
    if (!mimeType) {
      throw new Error("No supported recording format found in this browser");
    }
    
    // Initialize media recorder with combined stream
    mediaRecorder = new MediaRecorder(recordingStream, {
      mimeType: mimeType,
      videoBitsPerSecond: 3000000 // 3 Mbps for better quality
    });
    
    // Clear previous recordings
    recordedChunks = [];
    
    // Handle data available event
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    // Handle recording stop event
    mediaRecorder.onstop = saveRecording;
    
    // Start recording
    mediaRecorder.start(1000); // Collect data in 1-second chunks
    isRecording = true;
    
    // Update UI to toggle buttons
    recordBtn.style.display = 'none';
    recordBtn.nextElementSibling.style.display = 'none'; // Hide "record" text
    stopRecordBtn.style.display = 'block';
    stopRecordText.style.display = 'block';
    
    // Add recording indicator
    addRecordingIndicator();
    
    // Listen for the end of screen sharing (browser's native stop button)
    screenStream.getVideoTracks()[0].onended = () => {
      stopRecording();
    };
    
    console.log("Recording started with all participants' audio");
    
    // Start the recording timer
    startRecordingTimer();
  } catch (error) {
    console.error("Error starting recording:", error);
    alert("Could not start recording: " + error.message);
  }
}

/**
 * Add a visual recording indicator
 */
function addRecordingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'recording-indicator';
  indicator.innerHTML = `
    <div class="recording-dot"></div>
    <span>Recording</span>
  `;
  
  // Style the indicator
  indicator.style.position = 'fixed';
  indicator.style.top = '10px';
  indicator.style.left = '10px';
  indicator.style.backgroundColor = 'rgba(255, 59, 59, 0.8)';
  indicator.style.color = 'white';
  indicator.style.padding = '4px 10px';
  indicator.style.borderRadius = '4px';
  indicator.style.display = 'flex';
  indicator.style.alignItems = 'center';
  indicator.style.zIndex = '9999';
  indicator.style.fontFamily = 'Poppins, sans-serif';
  indicator.style.fontSize = '14px';
  
  // Style the recording dot
  const dot = indicator.querySelector('.recording-dot');
  dot.style.width = '12px';
  dot.style.height = '12px';
  dot.style.backgroundColor = 'red';
  dot.style.borderRadius = '50%';
  dot.style.marginRight = '8px';
  dot.style.animation = 'pulse 1.5s infinite';
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(indicator);
}

/**
 * Stop the ongoing recording
 */
function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    return;
  }
  
  mediaRecorder.stop();
  isRecording = false;
  
  // Stop all tracks in the recording stream
  if (recordingStream) {
    recordingStream.getTracks().forEach(track => track.stop());
    recordingStream = null;
  }
  
  // Clean up audio context resources
  if (audioContext) {
    for (const uid in audioSources) {
      audioSources[uid].disconnect();
    }
    audioSources = {};
    
    // Close audio context if supported
    if (audioContext.state !== 'closed' && audioContext.close) {
      audioContext.close();
    }
  }
  
  // Reset UI
  stopRecordBtn.style.display = 'none';
  stopRecordText.style.display = 'none';
  recordBtn.style.display = 'block';
  recordBtn.nextElementSibling.style.display = 'block'; // Show "record" text
  
  // Remove recording indicator
  const indicator = document.getElementById('recording-indicator');
  if (indicator) {
    document.body.removeChild(indicator);
  }
  
  // Stop the recording timer
  stopRecordingTimer();
  
  console.log("Recording stopped");
}

/**
 * Save the recording as a video file
 */
function saveRecording() {
  if (recordedChunks.length === 0) {
    console.warn("No recording data available");
    return;
  }
  
  // Create a Blob from the recorded chunks
  const blob = new Blob(recordedChunks, {
    type: mediaRecorder.mimeType || 'video/webm'
  });
  
  // Create URL for the recording
  const url = URL.createObjectURL(blob);
  
  // Create a link element to download the recording
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `meeting-recording-${timestamp}.webm`;
  
  // Add to DOM, trigger click and remove
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  console.log("Recording saved");
  
  // Show a notification to the user
  showSaveNotification();
}

/**
 * Show a notification that the recording was saved
 */
function showSaveNotification() {
  const notification = document.createElement('div');
  notification.className = 'recording-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <img src="./assets/check-circle.svg" alt="Success" width="24" height="24">
      <div class="notification-text">
        <h3>Recording Saved</h3>
        <p>Your meeting recording has been downloaded.</p>
      </div>
    </div>
    <button class="close-notification">×</button>
  `;
  
  // Style the notification
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = 'white';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.borderRadius = '8px';
  notification.style.padding = '15px';
  notification.style.zIndex = '9999';
  notification.style.minWidth = '300px';
  notification.style.maxWidth = '400px';
  notification.style.fontFamily = 'Poppins, sans-serif';
  
  // Style notification content
  const content = notification.querySelector('.notification-content');
  content.style.display = 'flex';
  content.style.alignItems = 'center';
  
  // Style text
  const textDiv = notification.querySelector('.notification-text');
  textDiv.style.marginLeft = '12px';
  
  // Style heading
  const heading = notification.querySelector('h3');
  heading.style.margin = '0 0 5px 0';
  heading.style.fontSize = '16px';
  heading.style.color = '#333';
  
  // Style paragraph
  const paragraph = notification.querySelector('p');
  paragraph.style.margin = '0';
  paragraph.style.fontSize = '14px';
  paragraph.style.color = '#666';
  
  // Style close button
  const closeBtn = notification.querySelector('.close-notification');
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#999';
  
  // Add close functionality
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(notification);
  });
  
  document.body.appendChild(notification);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 5000);
}

// Function to handle browser compatibility for recording
function checkBrowserSupport() {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return null;
}

// Add a recording timer feature
let recordingTimer;
let recordingDuration = 0;

function startRecordingTimer() {
  // Create timer element if it doesn't exist
  if (!document.getElementById('recording-timer')) {
    const timerElement = document.createElement('div');
    timerElement.id = 'recording-timer';
    timerElement.style.position = 'fixed';
    timerElement.style.top = '10px';
    timerElement.style.right = '10px';
    timerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    timerElement.style.color = 'white';
    timerElement.style.padding = '5px 10px';
    timerElement.style.borderRadius = '4px';
    timerElement.style.fontSize = '14px';
    timerElement.style.fontFamily = 'Poppins, sans-serif';
    timerElement.style.zIndex = '9999';
    document.body.appendChild(timerElement);
  }
  
  const timerElement = document.getElementById('recording-timer');
  recordingDuration = 0;
  timerElement.textContent = formatTime(recordingDuration);
  timerElement.style.display = 'block';
  
  recordingTimer = setInterval(() => {
    recordingDuration++;
    timerElement.textContent = formatTime(recordingDuration);
  }, 1000);
}

function stopRecordingTimer() {
  clearInterval(recordingTimer);
  const timerElement = document.getElementById('recording-timer');
  if (timerElement) {
    timerElement.style.display = 'none';
  }
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Add event handlers for new users joining during recording
client.on("user-published", (user, mediaType) => {
  if (isRecording && mediaType === 'audio' && audioContext) {
    setTimeout(() => {
      if (user.audioTrack && !audioSources[user.uid]) {
        const audioStream = new MediaStream([user.audioTrack._mediaStreamTrack]);
        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(audioDestination);
        audioSources[user.uid] = source;
        console.log(`Added user ${user.uid} audio to recording mix`);
      }
    }, 1000); // Short delay to ensure track is ready
  }
});

// Handle user leaving during recording
client.on("user-left", (user) => {
  if (isRecording && audioSources[user.uid]) {
    audioSources[user.uid].disconnect();
    delete audioSources[user.uid];
    console.log(`Removed user ${user.uid} audio from recording mix`);
  }
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

// ======================================================================================================================================

// subtitle button
function setupSubtitles() {
  let subtitleEnabled = false;
  let selectedLanguage = 'en-US';
  let subtitleOverlay, languageMenu, recognition;
  const languages = [
      { code: 'en-US', name: 'English' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'gu-IN', name: 'Gujarati' }
  ];

  document.addEventListener('DOMContentLoaded', () => {
      const subtitlesBtn = document.getElementById('subtitles-btn');
      subtitlesBtn.addEventListener('click', () => {
          if (!languageMenu) {
              languageMenu = document.createElement('div');
              languageMenu.style.cssText = 'position:absolute;bottom:100px;right:80px;background:#333;border-radius:8px;padding:10px;z-index:101;display:flex;flex-direction:column;gap:5px;';
              languages.forEach(lang => {
                  const btn = document.createElement('button');
                  btn.textContent = lang.name;
                  btn.style.cssText = 'padding:8px 15px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;text-align:left;font-family:Poppins,sans-serif;';
                  if (lang.code === selectedLanguage) btn.style.background = '#007bff';
                  btn.onclick = () => {
                      selectedLanguage = lang.code;
                      if (subtitleEnabled) {
                          recognition.stop();
                          startRecognition();
                      } else toggleSubtitles();
                      Array.from(languageMenu.children).forEach(b => b.style.background = '#555');
                      btn.style.background = '#007bff';
                      languageMenu.style.display = 'none';
                  };
                  languageMenu.appendChild(btn);
              });
              document.body.appendChild(languageMenu);
          }
          languageMenu.style.display = (languageMenu.style.display === 'flex') ? 'none' : 'flex';
      });

      subtitleOverlay = document.createElement('div');
      subtitleOverlay.id = 'subtitle-overlay';
      subtitleOverlay.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:120px;max-width:80%;min-width:300px;text-align:center;color:white;background:rgba(0,0,0,0.6);padding:10px 20px;font-family:Poppins,sans-serif;font-size:18px;z-index:100;display:none;border-radius:24px;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
      document.body.appendChild(subtitleOverlay);
  });

  function toggleSubtitles() {
      subtitleEnabled = !subtitleEnabled;
      subtitleOverlay.style.display = subtitleEnabled ? 'block' : 'none';
      if (subtitleEnabled) {
          startRecognition();
          document.getElementById('subtitles-btn').style.filter = 'invert(50%) sepia(100%) saturate(2000%) hue-rotate(190deg)';
      } else {
          recognition?.stop();
          document.getElementById('subtitles-btn').style.filter = '';
      }
  }

  function startRecognition() {
      if (!('webkitSpeechRecognition' in window)) {
          subtitleOverlay.textContent = 'Speech recognition not supported.';
          return;
      }
      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      recognition.onresult = e => {
          let finalTranscript = '', interimTranscript = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
              const transcript = e.results[i][0].transcript;
              if (e.results[i].isFinal) finalTranscript += transcript;
              else interimTranscript += transcript;
          }
          subtitleOverlay.textContent = finalTranscript || interimTranscript;
      };
      recognition.onerror = e => subtitleOverlay.textContent = `Error: ${e.error}`;
      recognition.onend = () => subtitleEnabled && recognition.start();
      recognition.start();
  }
}

// Call the function
setupSubtitles();

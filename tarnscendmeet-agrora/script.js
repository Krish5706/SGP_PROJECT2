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

// subtitle button


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
            
            // Create multiple emoji elements for a burst effect
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    createFloatingEmoji(emoji, emojiContainer);
                }, i * 150); // Stagger the creation
            }
            
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

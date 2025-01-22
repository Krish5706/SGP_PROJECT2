export const initializePeerConnection = (configuration) => {
    const peerConnection = new RTCPeerConnection(configuration);
    
    return peerConnection;
  };
  
  export const addStreamToPeerConnection = (peerConnection, stream) => {
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
  };
  
  export const createOffer = async (peerConnection) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  };
  
  export const createAnswer = async (peerConnection, offer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  };
  
  export const handleICECandidate = (peerConnection, ws, roomId) => {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
          roomId
        }));
      }
    };
  };
  
  export const getLocalStream = async (constraints = { video: true, audio: true }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };
import React from 'react';
import { Video, Camera, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';

const VideoControls = ({ 
  isAudioEnabled, 
  isVideoEnabled, 
  onToggleAudio, 
  onToggleVideo, 
  onEndCall 
}) => {
  return (
    <div className="flex justify-center space-x-4 mt-4">
      <button
        onClick={onToggleAudio}
        className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
      >
        {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
      <button
        onClick={onToggleVideo}
        className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
      >
        {isVideoEnabled ? <Camera size={24} /> : <VideoOff size={24} />}
      </button>
      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};

export default VideoControls;
import React from 'react';
import VideoConference from './components/VideoConference';

function App() {
  // Generate a random room ID for testing
  const roomId = Math.random().toString(36).substring(7);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Video Conference</h1>
        <VideoConference roomId={roomId} />
      </div>
    </div>
  );
}

export default App;
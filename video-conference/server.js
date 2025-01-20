const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// Store active rooms and their participants
const rooms = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const { type, roomId, userId } = data;
        
        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }
        
        const room = rooms.get(roomId);
        
        switch (type) {
            case 'join':
                // Add new user to room
                ws.userId = userId;
                ws.roomId = roomId;
                room.set(userId, ws);
                
                // Notify existing participants about new user
                room.forEach((participant, participantId) => {
                    if (participantId !== userId) {
                        // Tell new user about existing participant
                        ws.send(JSON.stringify({
                            type: 'user-joined',
                            userId: participantId
                        }));
                        
                        // Tell existing participant about new user
                        participant.send(JSON.stringify({
                            type: 'user-joined',
                            userId: userId
                        }));
                    }
                });
                break;
                
            case 'offer':
            case 'answer':
            case 'candidate':
                // Forward message to specific user
                const targetUser = room.get(data.target);
                if (targetUser) {
                    data.sender = userId;
                    targetUser.send(JSON.stringify(data));
                }
                break;
        }
    });
    
    ws.on('close', () => {
        if (ws.roomId && ws.userId) {
            const room = rooms.get(ws.roomId);
            if (room) {
                room.delete(ws.userId);
                
                // Notify other participants about user leaving
                room.forEach(participant => {
                    participant.send(JSON.stringify({
                        type: 'user-left',
                        userId: ws.userId
                    }));
                });
                
                // Remove room if empty
                if (room.size === 0) {
                    rooms.delete(ws.roomId);
                }
            }
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
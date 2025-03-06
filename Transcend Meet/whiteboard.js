// Whiteboard functionality
let canvas;
let ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'pen';
let currentColor = '#000000';
let currentLineWidth = 2;
let drawBuffer = [];

// Initialize whiteboard
function initializeWhiteboard() {
    console.log("Initializing whiteboard...");
    
    canvas = document.getElementById('whiteboard-canvas');
    if (!canvas) {
        console.error("Whiteboard canvas not found");
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    resizeCanvas();
    
    // Add event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Resize canvas when window is resized
    window.addEventListener('resize', resizeCanvas);
    
    // Tool selection
    const penTool = document.getElementById('pen-tool');
    const eraserTool = document.getElementById('eraser-tool');
    const colorPicker = document.getElementById('color-picker');
    const clearWhiteboardBtn = document.getElementById('clear-whiteboard');
    
    if (penTool) {
        penTool.addEventListener('click', () => {
            setTool('pen');
            penTool.classList.add('active');
            if (eraserTool) eraserTool.classList.remove('active');
        });
    }
    
    if (eraserTool) {
        eraserTool.addEventListener('click', () => {
            setTool('eraser');
            eraserTool.classList.add('active');
            if (penTool) penTool.classList.remove('active');
        });
    }
    
    // Color picker
    if (colorPicker) {
        colorPicker.addEventListener('change', (e) => {
            currentColor = e.target.value;
            if (currentTool === 'pen') {
                // Only change to pen if color changes and current tool is eraser
                setTool('pen');
                if (penTool) penTool.classList.add('active');
                if (eraserTool) eraserTool.classList.remove('active');
            }
        });
    }
    
    // Clear whiteboard
    if (clearWhiteboardBtn) {
        clearWhiteboardBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the whiteboard?')) {
                clearWhiteboardCanvas();
                
                // Notify other users about clear action
                if (meetingID) {
                    db.ref(`meetings/${meetingID}/whiteboard/cleared`).set({
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        userId: currentUser.id
                    });
                }
            }
        });
    }
}

// Resize canvas
function resizeCanvas() {
    const container = document.getElementById('whiteboard-container');
    if (!container || !canvas) return;
    
    const header = container.querySelector('.whiteboard-header');
    const headerHeight = header ? header.offsetHeight : 50;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - headerHeight;
    
    // Redraw from buffer after resize
    redrawFromBuffer();
}

// Redraw from buffer
function redrawFromBuffer() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all strokes from buffer
    drawBuffer.forEach(stroke => {
        ctx.beginPath();
        ctx.moveTo(stroke.startX * canvas.width, stroke.startY * canvas.height);
        ctx.lineTo(stroke.endX * canvas.width, stroke.endY * canvas.height);
        
        ctx.strokeStyle = stroke.tool === 'eraser' ? 'white' : stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    });
}

// Set current tool
function setTool(tool) {
    currentTool = tool;
    
    if (!canvas) return;
    
    if (tool === 'pen') {
        canvas.style.cursor = 'crosshair';
        currentLineWidth = 2;
    } else if (tool === 'eraser') {
        canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\'/%3E%3C/svg%3E") 12 12, auto';
        currentLineWidth = 20;
    }
}

// Start drawing
function startDrawing(e) {
    if (!ctx || !canvas) return;
    
    isDrawing = true;
    const pos = getPosition(e);
    [lastX, lastY] = [pos.x, pos.y];
}

// Draw on canvas
function draw(e) {
    if (!isDrawing || !ctx || !canvas) return;
    
    const pos = getPosition(e);
    const currentX = pos.x;
    const currentY = pos.y;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    
    if (currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth;
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = currentLineWidth;
    }
    
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Create stroke object for buffer and Firebase
    const stroke = {
        tool: currentTool,
        color: currentColor,
        lineWidth: currentLineWidth,
        startX: lastX / canvas.width,
        startY: lastY / canvas.height,
        endX: currentX / canvas.width,
        endY: currentY / canvas.height,
        timestamp: Date.now(),
        userId: currentUser.id
    };
    
    // Add to local buffer
    drawBuffer.push(stroke);
    
    // Save stroke to Firebase
    if (meetingID) {
        saveStrokeToFirebase(stroke);
    }
    
    [lastX, lastY] = [currentX, currentY];
}

// Stop drawing
function stopDrawing() {
    isDrawing = false;
}

// Get mouse or touch position
function getPosition(e) {
    if (!canvas) return { x: 0, y: 0 };
    
    let x, y;
    
    if (e.type.includes('mouse')) {
        x = e.offsetX;
        y = e.offsetY;
    } else {
        const rect = canvas.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    }
    
    return { x, y };
}

// Handle touch start
function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

// Handle touch move
function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}
// Save stroke to Firebase
function saveStrokeToFirebase(stroke) {
    if (!meetingID) return;
    
    db.ref(`meetings/${meetingID}/whiteboard/strokes`).push(stroke)
        .catch(error => {
            console.error("Error saving stroke to Firebase:", error);
        });
}

// Draw remote stroke from another participant
function drawRemoteStroke(stroke) {
    if (!ctx || !canvas) return;
    
    // Add to local buffer
    drawBuffer.push(stroke);
    
    // Draw the stroke
    ctx.beginPath();
    ctx.moveTo(stroke.startX * canvas.width, stroke.startY * canvas.height);
    ctx.lineTo(stroke.endX * canvas.width, stroke.endY * canvas.height);
    
    if (stroke.tool === 'pen') {
        ctx.strokeStyle = stroke.color;
    } else if (stroke.tool === 'eraser') {
        ctx.strokeStyle = 'white';
    }
    
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
}

// Clear whiteboard canvas
function clearWhiteboardCanvas() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear buffer
    drawBuffer = [];
}

// Load whiteboard data from Firebase
function loadWhiteboardData() {
    if (!meetingID) return;
    
    // First check if the whiteboard was cleared
    db.ref(`meetings/${meetingID}/whiteboard/cleared`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                // Clear local whiteboard
                clearWhiteboardCanvas();
                
                // Get last cleared timestamp
                const lastCleared = snapshot.val().timestamp;
                
                // Get strokes created after the last clear
                return db.ref(`meetings/${meetingID}/whiteboard/strokes`)
                    .orderByChild('timestamp')
                    .startAt(lastCleared)
                    .once('value');
            } else {
                // No clear event, get all strokes
                return db.ref(`meetings/${meetingID}/whiteboard/strokes`).once('value');
            }
        })
        .then(snapshot => {
            if (snapshot && snapshot.exists()) {
                // Process all strokes
                snapshot.forEach(childSnapshot => {
                    const stroke = childSnapshot.val();
                    drawRemoteStroke(stroke);
                });
            }
        })
        .catch(error => {
            console.error("Error loading whiteboard data:", error);
        });
}

// Setup whiteboard listeners
function setupWhiteboardListeners() {
    if (!meetingID) return;
    
    // Listen for new strokes
    db.ref(`meetings/${meetingID}/whiteboard/strokes`).on('child_added', snapshot => {
        const stroke = snapshot.val();
        // Only draw strokes from other users (our own strokes are already drawn)
        if (stroke.userId !== currentUser.id) {
            drawRemoteStroke(stroke);
        }
    });
    
    // Listen for whiteboard clear events
    db.ref(`meetings/${meetingID}/whiteboard/cleared`).on('value', snapshot => {
        if (snapshot.exists()) {
            const clearInfo = snapshot.val();
            // Only clear if another user cleared the whiteboard
            if (clearInfo.userId !== currentUser.id) {
                clearWhiteboardCanvas();
            }
        }
    });
}

// Export whiteboard as image
function exportWhiteboardAsImage() {
    if (!canvas) return null;
    
    return canvas.toDataURL('image/png');
}

// Save whiteboard as image
function saveWhiteboardAsImage() {
    if (!canvas) return;
    
    const dataUrl = exportWhiteboardAsImage();
    const link = document.createElement('a');
    link.download = `whiteboard-${meetingID}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
}

// Add export button to whiteboard if not present
function addExportButton() {
    const whiteboard = document.getElementById('whiteboard-container');
    const tools = whiteboard?.querySelector('.whiteboard-tools');
    
    if (tools && !document.getElementById('export-whiteboard')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-whiteboard';
        exportBtn.className = 'tool-btn';
        exportBtn.innerHTML = '<i class="fas fa-download"></i>';
        exportBtn.title = 'Export as image';
        exportBtn.addEventListener('click', saveWhiteboardAsImage);
        
        tools.appendChild(exportBtn);
    }
}

// Initialize whiteboard with export functionality
function initWhiteboardWithExport() {
    initializeWhiteboard();
    addExportButton();
    
    // Load existing whiteboard data if any
    loadWhiteboardData();
    
    // Setup listeners for real-time updates
    setupWhiteboardListeners();
}

// Call this function instead of initializeWhiteboard() for full functionality
// initWhiteboardWithExport();
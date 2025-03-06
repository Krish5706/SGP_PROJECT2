// Whiteboard functionality
let canvas;
let ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Initialize whiteboard
function initializeWhiteboard() {
    canvas = document.getElementById('whiteboard-canvas');
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
    document.getElementById('pen-tool').addEventListener('click', () => {
        setTool('pen');
        document.getElementById('pen-tool').classList.add('active');
        document.getElementById('eraser-tool').classList.remove('active');
    });
    
    document.getElementById('eraser-tool').addEventListener('click', () => {
        setTool('eraser');
        document.getElementById('eraser-tool').classList.add('active');
        document.getElementById('pen-tool').classList.remove('active');
    });
    
    // Color picker
    document.getElementById('color-picker').addEventListener('change', (e) => {
        currentColor = e.target.value;
    });
    
    // Clear whiteboard
    document.getElementById('clear-whiteboard').addEventListener('click', clearWhiteboard);
}

// Resize canvas
function resizeCanvas() {
    const container = document.getElementById('whiteboard-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - 50; // Subtract header height
}

// Set current tool
function setTool(tool) {
    currentTool = tool;
    
    if (tool === 'pen') {
        canvas.style.cursor = 'crosshair';
    } else if (tool === 'eraser') {
        canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\'/%3E%3C/svg%3E") 12 12, auto';
    }
}

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    const pos = getPosition(e);
    [lastX, lastY] = [pos.x, pos.y];
}

// Draw on canvas
function draw(e) {
    if (!isDrawing) return;
    
    const pos = getPosition(e);
    const currentX = pos.x;
    const currentY = pos.y;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    
    if (currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 2;
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 20;
    }
    
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Save stroke to Firebase
    saveStrokeToFirebase({
        tool: currentTool,
        color: currentColor,
        lineWidth: currentTool === 'pen' ? 2 : 20,
        startX: lastX / canvas.width,
        startY: lastY / canvas.height,
        endX: currentX / canvas.width,
        endY: currentY / canvas.height,
        timestamp: Date.now(),
        userId: currentUser.id
    });
    
    [lastX, lastY] = [currentX, currentY];
}

// Stop drawing
function stopDrawing() {
    isDrawing = false;
}

// Get mouse or touch position
function getPosition(e) {
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
    db.ref(`meetings/${meetingID}/whiteboard/strokes`).push(stroke);
}

// Draw remote stroke
function drawRemoteStroke(stroke) {
    // Convert relative coordinates to absolute
    const startX = stroke.startX * canvas.width;
    const startY = stroke.startY * canvas.height;
    const endX = stroke.endX * canvas.width;
    const endY = stroke.endY * canvas.height;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    if (stroke.tool === 'pen') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;
    } else if (stroke.tool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = stroke.lineWidth;
    }
    
    ctx.lineCap = 'round';
    ctx.stroke();
}

// Clear whiteboard
function clearWhiteboard() {
    if (confirm('Are you sure you want to clear the whiteboard?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Notify other users about clear action
        db.ref(`meetings/${meetingID}/whiteboard`).update({
            cleared: {
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                userId: currentUser.id
            }
        });
    }
}

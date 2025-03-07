// Whiteboard variables
let canvas;
let ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#000000';
let currentTool = 'pen';
let currentLineWidth = 3;
let whiteboardHistory = [];
let currentPage = 0;
let pages = [[]]; // Array to store drawing history for multiple pages

// Initialize the whiteboard
function initWhiteboard() {
    console.log("Initializing whiteboard...");
    
    // Get canvas and context
    canvas = document.getElementById('whiteboard-canvas');
    if (!canvas) {
        console.error("Whiteboard canvas element not found");
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    resizeCanvas();
    
    // Add event listeners
    setupWhiteboardListeners();
    
    // Setup tool buttons
    setupWhiteboardTools();
    
    // Clear canvas to ensure a fresh start
    clearCanvas();
    
    console.log("Whiteboard initialized successfully");
}

// Resize canvas to match container dimensions
function resizeCanvas() {
    const container = document.getElementById('whiteboard-container');
    if (!container || !canvas) return;
    
    // Get the available space in the container (accounting for the header)
    const header = container.querySelector('.whiteboard-header');
    const headerHeight = header ? header.offsetHeight : 0;
    
    // Set canvas dimensions
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - headerHeight - 10; // 10px for padding
    
    // Redraw canvas content after resize
    redrawCanvas();
}

// Set up event listeners for the whiteboard
function setupWhiteboardListeners() {
    if (!canvas) return;
    
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Window resize event
    window.addEventListener('resize', resizeCanvas);
}

// Handle touch start event
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// Handle touch move event
function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// Set up whiteboard tool buttons
function setupWhiteboardTools() {
    // Pen tool
    const penTool = document.getElementById('pen-tool');
    if (penTool) {
        penTool.addEventListener('click', () => {
            setActiveTool('pen');
            currentTool = 'pen';
            currentLineWidth = 3;
        });
    }
    
    // Eraser tool
    const eraserTool = document.getElementById('eraser-tool');
    if (eraserTool) {
        eraserTool.addEventListener('click', () => {
            setActiveTool('eraser');
            currentTool = 'eraser';
            currentLineWidth = 15;
        });
    }
    
    // Color picker
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            currentColor = e.target.value;
            // Switch to pen when color is changed
            setActiveTool('pen');
            currentTool = 'pen';
        });
    }
    
    // Clear whiteboard
    const clearBtn = document.getElementById('clear-whiteboard');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the whiteboard?')) {
                clearCanvas();
                // Clear history for current page
                pages[currentPage] = [];
                saveToWhiteboardHistory();
            }
        });
    }
    
    // Add page navigation buttons if they exist
    const prevPageBtn = document.getElementById('prev-page');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', goToPrevPage);
    }
    
    const nextPageBtn = document.getElementById('next-page');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', goToNextPage);
    }
    
    const addPageBtn = document.getElementById('add-page');
    if (addPageBtn) {
        addPageBtn.addEventListener('click', addNewPage);
    }
}

// Set the active tool (visual indicator)
function setActiveTool(tool) {
    // Remove active class from all tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected tool
    const toolBtn = document.getElementById(`${tool}-tool`);
    if (toolBtn) {
        toolBtn.classList.add('active');
    }
}

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    
    // Get canvas position relative to the viewport
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

// Draw on the canvas
function draw(e) {
    if (!isDrawing) return;
    
    // Get canvas position
    const rect = canvas.getBoundingClientRect();
    
    // Calculate current mouse position
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // Start a new path
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    
    // Set line properties
    ctx.lineWidth = currentLineWidth;
    ctx.lineCap = 'round';
    
    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff'; // White for eraser
    } else {
        ctx.strokeStyle = currentColor;
    }
    
    // Draw the line
    ctx.stroke();
    
    // Update last position
    lastX = currentX;
    lastY = currentY;
    
    // Add to drawing actions for current page
    const action = {
        tool: currentTool,
        color: currentTool === 'eraser' ? '#ffffff' : currentColor,
        lineWidth: currentLineWidth,
        fromX: lastX,
        fromY: lastY,
        toX: currentX,
        toY: currentY
    };
    
    // Add to current page history
    if (!pages[currentPage]) {
        pages[currentPage] = [];
    }
    pages[currentPage].push(action);
}

// Stop drawing
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveToWhiteboardHistory();
    }
}

// Save current state to whiteboard history
function saveToWhiteboardHistory() {
    // In a real app, you might want to send this data to other participants
    // For now, we'll just store it locally
    
    // If connected to Firebase, you could save the whiteboard state
    if (meetingID) {
        // Example Firebase implementation (uncomment to use)
        /*
        db.ref(`meetings/${meetingID}/whiteboard`).set({
            pages: pages,
            currentPage: currentPage,
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        });
        */
    }
}

// Clear the canvas
function clearCanvas() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Redraw the canvas based on history
function redrawCanvas() {
    if (!ctx || !canvas) return;
    
    // Clear canvas first
    clearCanvas();
    
    // Get actions for current page
    const pageActions = pages[currentPage] || [];
    
    // Redraw all actions
    pageActions.forEach(action => {
        ctx.beginPath();
        ctx.moveTo(action.fromX, action.fromY);
        ctx.lineTo(action.toX, action.toY);
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    });
}

// Page navigation functions
function goToPrevPage() {
    if (currentPage > 0) {
        currentPage--;
        redrawCanvas();
        updatePageIndicator();
    }
}

function goToNextPage() {
    if (currentPage < pages.length - 1) {
        currentPage++;
        redrawCanvas();
        updatePageIndicator();
    }
}

function addNewPage() {
    currentPage = pages.length;
    pages.push([]);
    clearCanvas();
    updatePageIndicator();
}

function updatePageIndicator() {
    const pageIndicator = document.getElementById('page-indicator');
    if (pageIndicator) {
        pageIndicator.textContent = `Page ${currentPage + 1} of ${pages.length}`;
    }
}

// Initialize whiteboard when the window loads
window.addEventListener('load', function() {
    // We don't auto-initialize here - the main meetingroom.js will call initWhiteboard
    // when the whiteboard is displayed
    console.log("Whiteboard script loaded");
});

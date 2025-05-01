// Meeting Scheduler App JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;
    
    // Load meetings from localStorage
    loadMeetings();
    
    // Form submission
    document.getElementById('meeting-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const title = document.getElementById('title').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const duration = document.getElementById('duration').value;
        const participants = document.getElementById('participants').value;
        const description = document.getElementById('description').value;
        
        // Create meeting object
        const meeting = {
            id: Date.now(), // Unique ID based on timestamp
            title,
            date,
            time,
            duration,
            participants,
            description
        };
        
        // Save meeting
        saveMeeting(meeting);
        
        // Reset form
        this.reset();
        
        // Set minimum date again after form reset
        document.getElementById('date').min = today;
        
        // Show success message
        showNotification('Meeting scheduled successfully!');
    });
});

// Save meeting to localStorage
function saveMeeting(meeting) {
    // Get existing meetings from localStorage
    let meetings = JSON.parse(localStorage.getItem('meetings')) || [];
    
    // Add new meeting
    meetings.push(meeting);
    
    // Sort meetings by date and time
    meetings.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });
    
    // Save to localStorage
    localStorage.setItem('meetings', JSON.stringify(meetings));
    
    // Reload meetings list
    loadMeetings();
}

// Load and display meetings
function loadMeetings() {
    // Get meetings from localStorage
    const meetings = JSON.parse(localStorage.getItem('meetings')) || [];
    
    // Get container
    const container = document.getElementById('meetings-container');
    container.innerHTML = '';
    
    // Remove past meetings
    const now = new Date();
    const filteredMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
        return meetingDate >= now;
    });
    
    // Save filtered meetings back to localStorage if any were removed
    if (filteredMeetings.length < meetings.length) {
        localStorage.setItem('meetings', JSON.stringify(filteredMeetings));
    }
    
    // Check if there are any meetings
    if (filteredMeetings.length === 0) {
        container.innerHTML = '<p>No upcoming meetings.</p>';
        return;
    }
    
    // Display each meeting
    filteredMeetings.forEach(meeting => {
        // Create meeting card
        const card = document.createElement('div');
        card.className = 'meeting-card';
        card.dataset.id = meeting.id;
        
        // Format date and time
        const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
        const formattedDate = meetingDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = meetingDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Calculate end time
        const endTime = new Date(meetingDate.getTime() + parseInt(meeting.duration) * 60000);
        const formattedEndTime = endTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = function() {
            deleteMeeting(meeting.id);
        };
        
        // Create meeting content
        card.innerHTML = `
            <div class="meeting-title">${meeting.title}</div>
            <div class="meeting-time">${formattedDate}</div>
            <div class="meeting-time">${formattedTime} - ${formattedEndTime} (${meeting.duration} min)</div>
            ${meeting.participants ? `<div class="meeting-participants"><strong>Participants:</strong> ${meeting.participants}</div>` : ''}
            ${meeting.description ? `<div class="meeting-description">${meeting.description}</div>` : ''}
        `;
        
        card.appendChild(deleteBtn);
        container.appendChild(card);
    });
}

// Delete meeting
function deleteMeeting(id) {
    // Confirm deletion
    if (confirm('Are you sure you want to delete this meeting?')) {
        // Get meetings from localStorage
        let meetings = JSON.parse(localStorage.getItem('meetings')) || [];
        
        // Remove the meeting with the specified id
        meetings = meetings.filter(meeting => meeting.id !== parseInt(id));
        
        // Save to localStorage
        localStorage.setItem('meetings', JSON.stringify(meetings));
        
        // Reload meetings
        loadMeetings();
        
        // Show notification
        showNotification('Meeting deleted');
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add styles inline since we're dynamically creating this
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#3498db';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.3s';
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
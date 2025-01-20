// Generate a unique meeting ID
function generateMeetingId() {
    return 'meeting-' + Math.random().toString(36).substring(2, 11);
}

// Create a meeting link with custom options
function createMeetingLink(options = {}) {
    const {
        hostName = '',
        meetingTitle = '',
        scheduledTime = null,
        duration = 60 // minutes
    } = options;

    // Generate a unique meeting ID if not provided
    const meetingId = options.meetingId || generateMeetingId();
    
    // Create the base URL
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    
    // Create query parameters
    const params = new URLSearchParams({
        room: meetingId,
        title: meetingTitle,
        host: hostName
    });

    if (scheduledTime) {
        params.append('time', scheduledTime.toISOString());
        params.append('duration', duration.toString());
    }

    // Return meeting info object
    return {
        meetingId,
        fullUrl: `${baseUrl}?${params.toString()}`,
        shortUrl: `${baseUrl}?room=${meetingId}`,
        info: {
            title: meetingTitle,
            host: hostName,
            scheduledTime,
            duration
        }
    };
}

// Format meeting details for sharing
function formatMeetingDetails(meetingInfo) {
    const { info, fullUrl } = meetingInfo;
    
    let messageLines = [
        `🎥 Video Meeting: ${info.title || 'Untitled Meeting'}`,
        `🔗 Join URL: ${fullUrl}`,
        `👤 Host: ${info.host || 'Anonymous'}`
    ];

    if (info.scheduledTime) {
        const timeStr = new Date(info.scheduledTime).toLocaleString();
        messageLines.push(`📅 Time: ${timeStr}`);
        messageLines.push(`⏱️ Duration: ${info.duration} minutes`);
    }

    return messageLines.join('\n');
}

// Share meeting link across different platforms
async function shareMeetingLink(meetingInfo, method = 'copy') {
    const messageText = formatMeetingDetails(meetingInfo);
    
    switch (method) {
        case 'copy':
            try {
                await navigator.clipboard.writeText(messageText);
                return { success: true, message: 'Meeting details copied to clipboard!' };
            } catch (err) {
                console.error('Failed to copy:', err);
                return { success: false, message: 'Failed to copy to clipboard', error: err };
            }
            
        case 'email':
            const emailSubject = encodeURIComponent(meetingInfo.info.title || 'Video Meeting Invitation');
            const emailBody = encodeURIComponent(messageText);
            window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
            return { success: true, message: 'Email client opened' };
            
        case 'calendar':
            // Generate calendar event URL (Google Calendar format)
            const calendarUrl = new URL('https://calendar.google.com/calendar/render');
            calendarUrl.searchParams.append('action', 'TEMPLATE');
            calendarUrl.searchParams.append('text', meetingInfo.info.title || 'Video Meeting');
            calendarUrl.searchParams.append('details', messageText);
            if (meetingInfo.info.scheduledTime) {
                const endTime = new Date(meetingInfo.info.scheduledTime);
                endTime.setMinutes(endTime.getMinutes() + meetingInfo.info.duration);
                calendarUrl.searchParams.append('dates', 
                    `${formatDateForCalendar(meetingInfo.info.scheduledTime)}/${formatDateForCalendar(endTime)}`
                );
            }
            window.open(calendarUrl.toString());
            return { success: true, message: 'Calendar opened' };
    }
}

// Helper function to format date for calendar
function formatDateForCalendar(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Function to generate a meeting UI element
function createMeetingLinkElement(meetingInfo) {
    const container = document.createElement('div');
    container.className = 'meeting-link-container';
    
    const html = `
        <div class="meeting-info">
            <h3>${meetingInfo.info.title || 'Untitled Meeting'}</h3>
            ${meetingInfo.info.host ? `<p>Host: ${meetingInfo.info.host}</p>` : ''}
            ${meetingInfo.info.scheduledTime ? 
                `<p>Time: ${new Date(meetingInfo.info.scheduledTime).toLocaleString()}</p>` : ''}
        </div>
        <div class="meeting-actions">
            <button class="copy-btn">Copy Link</button>
            <button class="email-btn">Email</button>
            <button class="calendar-btn">Add to Calendar</button>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners
    container.querySelector('.copy-btn').addEventListener('click', () => 
        shareMeetingLink(meetingInfo, 'copy'));
    container.querySelector('.email-btn').addEventListener('click', () => 
        shareMeetingLink(meetingInfo, 'email'));
    container.querySelector('.calendar-btn').addEventListener('click', () => 
        shareMeetingLink(meetingInfo, 'calendar'));
        
    return container;
}

export {
    generateMeetingId,
    createMeetingLink,
    formatMeetingDetails,
    shareMeetingLink,
    createMeetingLinkElement
};
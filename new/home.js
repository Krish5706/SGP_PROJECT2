// Add interactivity to buttons
document.addEventListener("DOMContentLoaded", () => {
    const startMeetingBtn = document.getElementById("start-meeting");
    const joinMeetingBtn = document.getElementById("join-meeting");
  
    startMeetingBtn.addEventListener("click", () => {
      alert("Starting a new meeting...");
      // Add logic to redirect to meeting creation page
      window.location.href = "/start-meeting.html";
    });
  
    joinMeetingBtn.addEventListener("click", () => {
      const meetingCode = prompt("Enter the meeting code:");
      if (meetingCode) {
        alert(`Joining meeting with code: ${meetingCode}`);
        // Add logic to redirect to meeting room
        window.location.href = `/join-meeting.html?code=${meetingCode}`;
      } else {
        alert("Meeting code is required to join.");
      }
    });
  });
  
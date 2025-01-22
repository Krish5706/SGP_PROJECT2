// import React, { useState, useEffect } from 'react';
// import {
//   Mic, MicOff, Video, VideoOff, Monitor,
//   MessageSquare, Users, Hand, X, Globe,
//   UserPlus, Volume2, VolumeX, Edit3, QrCode,
//   Copy, ChevronRight, ChevronLeft, Check,
//   PhoneOff, Share2, Bell
// } from 'lucide-react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Alert,
//   AlertDescription,
//   AlertTitle,
// } from "@/components/ui/alert";

// const TransceedMeet = () => {
//   // State Management
//   const [view, setView] = useState('home'); // home, meeting
//   const [meetingId, setMeetingId] = useState('');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showTranslationPanel, setShowTranslationPanel] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [joinSettings, setJoinSettings] = useState({
//     audio: true,
//     video: true,
//     screen: false,
//     language: 'en'
//   });
//   const [panels, setPanels] = useState({
//     chat: false,
//     participants: false,
//     translation: false
//   });

//   // Generate Meeting ID
//   const generateMeeting = () => {
//     const id = Math.random().toString(36).substring(2, 12).toUpperCase();
//     setMeetingId(id);
//     setShowCreateModal(true);
//   };

//   // Home View Component
//   const HomeView = () => (
//     <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 md:p-8">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <header className="text-center mb-12">
//           <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
//             Transceed Meet
//           </h1>
//           <p className="text-gray-600">
//             Connect, collaborate, and communicate across languages
//           </p>
//         </header>

//         {/* Main Content */}
//         <div className="grid md:grid-cols-2 gap-8">
//           {/* Create Meeting Panel */}
//           <div className="backdrop-blur-lg bg-white/30 rounded-2xl p-6 shadow-lg border border-white/50">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">
//               Create a Meeting
//             </h2>
//             <p className="text-gray-600 mb-6">
//               Start a new meeting and invite others to join
//             </p>
//             <button
//               onClick={generateMeeting}
//               className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-3 transition duration-200 backdrop-blur-sm"
//             >
//               <UserPlus size={20} />
//               Create Meeting
//             </button>
//           </div>

//           {/* Join Meeting Panel */}
//           <div className="backdrop-blur-lg bg-white/30 rounded-2xl p-6 shadow-lg border border-white/50">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">
//               Join a Meeting
//             </h2>
//             <div className="space-y-4">
//               <input
//                 type="text"
//                 placeholder="Enter Meeting ID"
//                 className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
              
//               {/* Settings */}
//               <div className="space-y-3">
//                 <label className="flex items-center gap-3 text-gray-700">
//                   <input
//                     type="checkbox"
//                     checked={joinSettings.audio}
//                     onChange={() => setJoinSettings(prev => ({...prev, audio: !prev.audio}))}
//                     className="rounded border-gray-300"
//                   />
//                   <Mic size={18} />
//                   Enable Audio
//                 </label>
                
//                 <label className="flex items-center gap-3 text-gray-700">
//                   <input
//                     type="checkbox"
//                     checked={joinSettings.video}
//                     onChange={() => setJoinSettings(prev => ({...prev, video: !prev.video}))}
//                     className="rounded border-gray-300"
//                   />
//                   <Video size={18} />
//                   Enable Video
//                 </label>

//                 {/* Language Selection */}
//                 <div className="flex items-center gap-3">
//                   <Globe size={18} className="text-gray-700" />
//                   <select
//                     value={joinSettings.language}
//                     onChange={(e) => setJoinSettings(prev => ({...prev, language: e.target.value}))}
//                     className="flex-1 px-3 py-1 rounded-lg bg-white/50 border border-white/50"
//                   >
//                     <option value="en">English</option>
//                     <option value="es">Spanish</option>
//                     <option value="fr">French</option>
//                     <option value="de">German</option>
//                     <option value="zh">Chinese</option>
//                   </select>
//                 </div>
//               </div>

//               <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-6 py-3 transition duration-200">
//                 Join Meeting
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Create Meeting Modal */}
//       <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
//         <DialogContent className="backdrop-blur-lg bg-white/80 border border-white/50">
//           <DialogHeader>
//             <DialogTitle>Meeting Created</DialogTitle>
//             <DialogDescription>
//               Share this meeting ID or QR code with participants
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 p-4">
//             {/* Meeting ID */}
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={meetingId}
//                 readOnly
//                 className="flex-1 px-4 py-2 rounded-lg bg-white/50 border border-white/50"
//               />
//               <button
//                 onClick={() => navigator.clipboard.writeText(meetingId)}
//                 className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
//               >
//                 <Copy size={20} />
//               </button>
//             </div>

//             {/* QR Code Placeholder */}
//             <div className="flex justify-center p-4 bg-white/50 rounded-lg">
//               <QrCode size={160} />
//             </div>

//             {/* Share Options */}
//             <div className="flex justify-end gap-2">
//               <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
//                 <Share2 size={20} />
//                 Share Link
//               </button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );

//   // Notification System
//   const addNotification = (message, type = 'info') => {
//     const newNotification = {
//       id: Date.now(),
//       message,
//       type
//     };
//     setNotifications(prev => [...prev, newNotification]);
//     setTimeout(() => {
//       setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
//     }, 5000);
//   };

//   return (
//     <div>
//       {/* Main Content */}
//       {view === 'home' ? <HomeView /> : null}

//       {/* Notification System */}
//       <div className="fixed top-4 right-4 z-50 space-y-2">
//         {notifications.map(notification => (
//           <Alert key={notification.id} className="backdrop-blur-lg bg-white/80 border border-white/50">
//             <Bell className="h-4 w-4" />
//             <AlertTitle>Notification</AlertTitle>
//             <AlertDescription>{notification.message}</AlertDescription>
//           </Alert>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TransceedMeet;

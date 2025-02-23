// Fetching user data from Firestore

import { auth, db } from './firebase';

// Function to fetch user data
const getUserData = async () => {
  const user = auth.currentUser; // Get the currently authenticated user

  if (user) {
    try {
      // Get the user data from the 'users' collection, using the user's UID
      const userDoc = await db.collection('users').doc(user.uid).get();

      if (userDoc.exists) {
        console.log('User data:', userDoc.data());
        return userDoc.data();
      } else {
        console.log('No such user!');
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  } else {
    console.log('No user is signed in.');
  }
};

// Example usage
getUserData().then((data) => {
  if (data) {
    console.log('User data:', data);
  } else {
    console.log('User not found.');
  }
});

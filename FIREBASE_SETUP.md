// 📚 FIREBASE SETUP GUIDE FOR BREAD BOT
// Complete guide to integrating Firebase with the Bread Bot

// ==========================================
// STEP 1: ENVIRONMENT SETUP
// ==========================================
// Add these environment variables to your .env file:
// 
// FIREBASE_API_KEY=your_api_key
// FIREBASE_AUTH_DOMAIN=your_auth_domain
// FIREBASE_DATABASE_URL=your_database_url
// FIREBASE_PROJECT_ID=your_project_id
// FIREBASE_STORAGE_BUCKET=your_storage_bucket
// FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// FIREBASE_APP_ID=your_app_id
// FIREBASE_MEASUREMENT_ID=your_measurement_id

// ==========================================
// STEP 2: IMPORT FIREBASE IN YOUR CODE
// ==========================================
// In app.js or any other file where you want to use Firebase:
//
// import { app } from './firebase-config.js';
// import { saveUserToFirebase, getUserFromFirebase } from './firebase-usage.js';

// ==========================================
// STEP 3: USE FIREBASE FUNCTIONS
// ==========================================
// Example: Award butter points and save to Firebase
//
// app.command('/butter-up', async ({ command, ack, client }) => {
//   await ack();
//   
//   const receiverMatch = command.text.match(/<@([A-Z0-9]+)>/);
//   const receiver = receiverMatch ? receiverMatch[1] : null;
//   
//   if (receiver) {
//     // Save to Firebase!
//     await saveUserToFirebase(receiver, 1, 'Flour Peasant');
//   }
// });

// ==========================================
// AVAILABLE FIREBASE FUNCTIONS
// ==========================================

// 💾 saveUserToFirebase(userId, points, title)
// Save a user's data to Firebase Realtime Database
//
// Usage:
// await saveUserToFirebase('U12345', 10, 'Earl of Bread');

// 📖 getUserFromFirebase(userId)
// Get a user's data from Firebase
//
// Usage:
// const user = await getUserFromFirebase('U12345');
// console.log(user.points); // 10

// 👥 getAllUsersFromFirebase()
// Get all users from Firebase
//
// Usage:
// const allUsers = await getAllUsersFromFirebase();

// 🔄 updateUserPointsInFirebase(userId, newPoints)
// Update a user's butter points in Firebase
//
// Usage:
// await updateUserPointsInFirebase('U12345', 15);

// 🗑️ deleteUserFromFirebase(userId)
// Delete a user from Firebase
//
// Usage:
// await deleteUserFromFirebase('U12345');

// ==========================================
// FIREBASE REALTIME DATABASE STRUCTURE
// ==========================================
// Your Firebase Realtime Database will look like this:
//
// users/
//   U12345/
//     points: 10
//     title: "Earl of Bread"
//     updatedAt: "2026-01-21T12:00:00.000Z"
//   U67890/
//     points: 5
//     title: "Flour Peasant"
//     updatedAt: "2026-01-21T11:30:00.000Z"

// ==========================================
// SECURITY RULES
// ==========================================
// Add these rules to your Firebase Console > Database > Rules
// to protect your data:
//
// {
//   "rules": {
//     "users": {
//       ".read": true,
//       ".write": "auth.uid != null"
//     }
//   }
// }

// ==========================================
// TROUBLESHOOTING
// ==========================================
// Q: I get an error about missing environment variables
// A: Make sure your .env file has all FIREBASE_* variables set!
//
// Q: Firebase isn't saving my data
// A: Check the browser console for errors and verify your database URL
//
// Q: How do I view my data in Firebase?
// A: Go to Firebase Console > Realtime Database to see your data in real-time!

// ==========================================
// RESOURCES
// ==========================================
// Firebase Docs: https://firebase.google.com/docs/database
// Slack Bolt Docs: https://tools.slack.dev/bolt-js/
// GitHub: https://github.com/slack-samples/bolt-js-starter-template

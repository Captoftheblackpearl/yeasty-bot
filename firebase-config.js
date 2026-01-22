// 🔥 FIREBASE ADMIN CONFIGURATION
// This file initializes Firebase Admin SDK for the Bread Bot
// Using Admin SDK allows us to run on a server with full database access!

import admin from 'firebase-admin';

// ⚠️ IMPORTANT!!!
// Set your Firebase credentials using one of these methods:
// 1. GOOGLE_APPLICATION_CREDENTIALS environment variable (best for production)
// 2. Place service account JSON in project root
// 3. Use firebase-admin emulator for local development

// 🛡️ INITIALIZE FIREBASE ADMIN
// Check if already initialized (prevents duplicate app errors)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('✨ Firebase Admin initialized successfully!');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

// 📋 GET DATABASE REFERENCE
const db = admin.database();

// 📚 EXPORT FOR USE IN OTHER FILES
export { admin, db };

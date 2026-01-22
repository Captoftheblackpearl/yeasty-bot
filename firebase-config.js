// 🔥 FIREBASE ADMIN CONFIGURATION
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // 1. Grab the JSON string from Render's Environment Variables
    // 2. Parse it back into a JavaScript Object
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      // Use .cert() instead of .applicationDefault()
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    
    console.log('✨ Firebase Admin initialized with Service Account!');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    console.log('Check if FIREBASE_SERVICE_ACCOUNT is correctly set in Render.');
  }
}

const db = admin.database();
export { admin, db };
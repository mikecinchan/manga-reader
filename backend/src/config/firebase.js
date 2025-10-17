const admin = require('firebase-admin');
const path = require('path');

try {
  let serviceAccount;

  // In production, read credentials from environment variable
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_CREDENTIALS) {
    console.log('Loading Firebase credentials from environment variable');
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } else {
    // In development, read from file
    console.log('Loading Firebase credentials from file');
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    serviceAccount = require(serviceAccountPath);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);

  if (process.env.NODE_ENV === 'production') {
    console.log('Please ensure FIREBASE_CREDENTIALS environment variable is set');
  } else {
    console.log('Please ensure serviceAccountKey.json is placed in backend/src/config/');
  }

  // Exit if in production and Firebase fails
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };

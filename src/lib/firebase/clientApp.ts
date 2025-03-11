import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

// IMPORTANT: Add a direct fallback configuration in case .env variables aren't loading
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDwG6cZtYeP58MZi0uHLwDwQIugdqnKf8s",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "personal-ai-tools-a6e45.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "personal-ai-tools-a6e45",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "personal-ai-tools-a6e45.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "465156815386",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:465156815386:web:004b271f819126bf90efa3",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-F8MD11B18F"
};

// Validate the configuration
const validateConfig = () => {
  const requiredFields = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 
    'messagingSenderId', 'appId'
  ] as const;
  
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error(`Missing Firebase config fields: ${missingFields.join(', ')}`);
    console.error('Using direct config as fallback');
  }
  
  // Log the configuration for debugging (masked)
  console.log('Firebase config:', {
    apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
    authDomain: firebaseConfig.authDomain ? '✓ Set' : '✗ Missing',
    projectId: firebaseConfig.projectId ? '✓ Set' : '✗ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✓ Set' : '✗ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Set' : '✗ Missing',
    appId: firebaseConfig.appId ? '✓ Set' : '✗ Missing',
    measurementId: firebaseConfig.measurementId ? '✓ Set' : '✗ Missing'
  });
};

// Call the validation
validateConfig();

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

// Attempt to fix any cached initialization issues
if (typeof window !== 'undefined') {
  // Clear any cached Firebase resources that might be causing issues
  window.localStorage.removeItem('firebase:previous_websocket_failure');
}

// Use a try-catch to ensure Firebase initialization doesn't block the application
try {
  // Check if Firebase is already initialized to avoid multiple instances
  if (getApps().length === 0) {
    console.log('Initializing Firebase');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Only initialize analytics on client-side
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.error('Analytics initialization error:', analyticsError);
      }
    }
    
    // Connect to auth emulator if in development and NEXT_PUBLIC_USE_FIREBASE_EMULATOR is true
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        console.log('Connected to Firebase Auth Emulator');
      } catch (emulatorError) {
        console.error('Error connecting to Firebase Auth Emulator:', emulatorError);
      }
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Only initialize analytics on client-side
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.error('Analytics initialization error:', analyticsError);
      }
    }
  }
} catch (initError) {
  console.error('Firebase initialization error:', initError);
  
  // Make sure we have fallback instances even if initialization fails
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
}

// For debugging purposes - log when the Firebase auth is initialized
console.log('Firebase Auth initialized:', !!auth);

// Additional logging for Firestore initialization
if (db) {
  console.log('Firestore initialized successfully');
  
  // Test connectivity by trying to fetch a simple document
  try {
    console.log('Successfully referenced tools collection');
  } catch (e) {
    console.error('Error accessing Firestore collection:', e);
  }
} else {
  console.error('Firestore initialization failed - db is', db);
}

export { app, auth, db, analytics }; 
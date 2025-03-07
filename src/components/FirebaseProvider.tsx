"use client";

import { ReactNode, useState, useEffect } from "react";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { FirebaseStorage, getStorage, connectStorageEmulator } from "firebase/storage";
import { app, auth, db } from "../lib/firebase/clientApp";


// Create a context to share Firebase instances
import { createContext, useContext } from "react";

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  initialized: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
  storage: null,
  initialized: false,
});

export const useFirebase = () => useContext(FirebaseContext);

interface FirebaseProviderProps {
  children: ReactNode;
}

export default function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [firebaseState, setFirebaseState] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    db: null,
    storage: null,
    initialized: false,
  });

  // Initialize Firebase only on the client side
  useEffect(() => {
    // Add force initialize timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Firebase initialization timed out - forcing render anyway");
      setFirebaseState(prev => ({
        ...prev,
        initialized: true,
        app: app,
        auth: auth,
        db: db,
        storage: null
      }));
    }, 5000); // 5 second timeout

    try {
      // Use the existing app, auth, and db instances from clientApp.ts
      const storage = getStorage(app);

      // Connect to emulators in development for storage
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
        try {
          if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST && 
              process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT) {
            connectStorageEmulator(
              storage, 
              process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST, 
              parseInt(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT)
            );
            console.log('Firebase Storage emulator connected');
          }
        } catch (error) {
          console.error('Error connecting to Firebase Storage emulator:', error);
        }
      }

      // Set the Firebase instances in state
      setFirebaseState({
        app,
        auth,
        db,
        storage,
        initialized: true,
      });

      console.log('Firebase context initialized successfully');
      clearTimeout(timeoutId); // Clear timeout as initialization succeeded
    } catch (error) {
      console.error('Error initializing Firebase context:', error);
      // Set initialized to true anyway to prevent blocking the UI
      setFirebaseState(prev => ({ 
        ...prev, 
        initialized: true,
        app: app,
        auth: auth,
        db: db
      }));
      clearTimeout(timeoutId); // Clear timeout as we've already handled the error
    }

    return () => clearTimeout(timeoutId);
  }, []);

  // Shorter loading time - max 2 seconds wait
  useEffect(() => {
    const maxWaitTime = setTimeout(() => {
      if (!firebaseState.initialized) {
        console.log("Maximum wait time exceeded - forcing Firebase initialization state");
        setFirebaseState(prev => ({ ...prev, initialized: true }));
      }
    }, 2000);
    
    return () => clearTimeout(maxWaitTime);
  }, [firebaseState.initialized]);

  // Render loading state while Firebase is initializing - but limit to 2 seconds max
  if (!firebaseState.initialized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={firebaseState}>
      {children}
    </FirebaseContext.Provider>
  );
} 
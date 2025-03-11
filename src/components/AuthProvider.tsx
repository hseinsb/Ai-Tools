"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  GoogleAuthProvider,
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  browserLocalPersistence,
  setPersistence,
  getAuth
} from 'firebase/auth';
import { app } from '@/lib/firebase/clientApp';

// Get the auth instance directly in this file to avoid import issues
const auth = getAuth(app);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => { throw new Error('Not implemented') },
  login: async () => { throw new Error('Not implemented') },
  loginWithGoogle: async () => { throw new Error('Not implemented') },
  logout: async () => { throw new Error('Not implemented') },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth persistence
  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase auth persistence set to LOCAL");
      } catch (error) {
        console.error("Error setting auth persistence:", error);
      }
    };
    
    initAuth();
    
    // Ensure loading state is cleared even if auth initialization has issues
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Auth loading timeout - forcing loading to false");
        setLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Set up auth state listener
  useEffect(() => {
    console.log("Setting up auth state listener");
    // eslint-disable-next-line prefer-const
    let authTimeoutId: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      
      // Clear timeout if auth state resolved
      if (authTimeoutId) clearTimeout(authTimeoutId);
    }, (error) => {
      console.error("Auth state error:", error);
      setError(error.message);
      setLoading(false);
      
      // Clear timeout if auth state resolved with error
      if (authTimeoutId) clearTimeout(authTimeoutId);
    });
    
    // Fallback to ensure loading state is cleared if onAuthStateChanged doesn't fire
    authTimeoutId = setTimeout(() => {
      console.log("Auth state listener timeout - forcing loading to false");
      setLoading(false);
    }, 2000);

    return () => {
      unsubscribe();
      if (authTimeoutId) clearTimeout(authTimeoutId);
    };
  }, []);

  const signUp = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: unknown) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log("Attempting login with:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful");
      return userCredential.user;
    } catch (error: unknown) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } catch (error: unknown) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error: unknown) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      error, 
      signUp, 
      login, 
      loginWithGoogle,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
} 
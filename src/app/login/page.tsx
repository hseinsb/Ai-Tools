/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase/clientApp';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const [showTestMode, setShowTestMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user } = useAuth();
  
  // Get the callback URL from the query string
  const callbackUrl = searchParams?.get('callbackUrl') || '/profile';
  
  // If user is already authenticated, redirect to the callback URL
  useEffect(() => {
    if (user) {
      setDebug(`User authenticated, redirecting to ${callbackUrl}`);
      router.push(callbackUrl);
    }
  }, [user, router, callbackUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setDebug('Attempting login with email/password...');
      
      await login(email, password);
      setDebug('Login successful, checking user state...');
      
      // The useEffect above should handle redirection once user state changes
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle Firebase auth errors specifically for invalid credentials
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. If you are a new user, please register first.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account exists with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError(err.message || 'Failed to log in');
      }
      setDebug(`Login error: ${err.code || 'unknown'}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);
      setError('');
      setDebug('Attempting login with Google...');
      
      await loginWithGoogle();
      setDebug('Google login successful, checking user state...');
      
      // The useEffect above should handle redirection once user state changes
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else {
        setError(err.message || 'Failed to log in with Google');
      }
      setDebug(`Google login error: ${err.code || 'unknown'}`);
    } finally {
      setGoogleLoading(false);
    }
  }

  // Add test account creation function
  const createTestAccount = async () => {
    try {
      setDebug('Creating test account...');
      const testEmail = 'test@example.com';
      const testPassword = 'Password123!';
      
      const auth = getAuth(app);
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      
      setDebug('Test account created successfully.');
      // Auto-fill the form with test credentials
      setEmail(testEmail);
      setPassword(testPassword);
    } catch (err: any) {
      console.error('Test account creation error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setDebug('Test account already exists, you can use test@example.com with password: Password123!');
        // Auto-fill anyway
        setEmail('test@example.com');
        setPassword('Password123!');
      } else {
        setError(`Failed to create test account: ${err.message}`);
        setDebug(`Error code: ${err.code}`);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">Log In</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {debug && (
        <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded mb-4 text-xs">
          Debug: {debug}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="mt-4 w-full flex justify-center items-center bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
              fill="currentColor"
            />
          </svg>
          {googleLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Register
        </Link>
      </div>
      
      {/* Add a developer mode toggle */}
      <div className="mt-6 text-center">
        <button 
          type="button"
          onClick={() => setShowTestMode(!showTestMode)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showTestMode ? 'Hide Developer Options' : 'Show Developer Options'}
        </button>
        
        {showTestMode && (
          <div className="mt-4 p-4 border border-gray-300 rounded-md">
            <h3 className="font-medium mb-2">Developer Options</h3>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={createTestAccount}
                className="bg-purple-500 text-white px-4 py-2 rounded text-sm"
              >
                Create Test Account
              </button>
              <Link 
                href="/firebase-debug" 
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm text-center"
              >
                Firebase Debug Page
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
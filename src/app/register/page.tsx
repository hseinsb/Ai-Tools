'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/clientApp';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  
  // Remove the automatic redirect to prevent premature navigation
  // We'll manually navigate after successful registration

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Use Firebase directly to avoid context issues
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User registered successfully:", userCredential.user.uid);
      
      setSuccess('Account created successfully! You can now log in.');
      
      // Instead of automatic redirect, show success message and add a button
      // The user can click to go to login page
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle Firebase auth errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Failed to register');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    try {
      setGoogleLoading(true);
      setError('');
      
      await loginWithGoogle();
      // Do not auto-redirect, set success message instead
      setSuccess('Google sign-in successful!');
      
      // Wait a moment, then redirect manually
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-up cancelled. Please try again.');
      } else {
        setError(err.message || 'Failed to sign up with Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => router.push('/login')}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
      
      {!success && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-2">
              Email Address
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
          
          <div className="mb-4">
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
              minLength={6}
            />
            <p className="text-sm text-gray-500 mt-1">Must be at least 6 characters</p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
      )}
      
      {!success && (
        <>
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
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="mt-4 w-full flex justify-center items-center bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
                  fill="currentColor"
                />
              </svg>
              {googleLoading ? 'Signing up...' : 'Sign up with Google'}
            </button>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Log In
            </Link>
          </div>
        </>
      )}
      
      {/* Add a direct registration component for debugging */}
      <div className="mt-8 text-center">
        <button 
          type="button"
          onClick={() => {
            const debugElement = document.getElementById('debug-register');
            if (debugElement) {
              debugElement.style.display = debugElement.style.display === 'none' ? 'block' : 'none';
            }
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Show Debug Tools
        </button>
        
        <div id="debug-register" style={{ display: 'none' }}>
          <div className="mt-4 p-4 border border-gray-300 bg-gray-50 rounded-md text-left">
            <h3 className="font-medium mb-2">Direct Registration</h3>
            <p className="text-xs mb-2 text-gray-500">This bypasses the normal registration flow and uses Firebase directly</p>
            <button
              onClick={async () => {
                try {
                  const testEmail = `test_${Math.floor(Math.random() * 1000)}@example.com`;
                  const testPassword = 'Password123!';
                  
                  setIsLoading(true);
                  setError('');
                  setSuccess('');
                  
                  const userCred = await createUserWithEmailAndPassword(
                    auth, 
                    testEmail, 
                    testPassword
                  );
                  
                  setSuccess(`Test account created: ${testEmail} with password: Password123! - UID: ${userCred.user.uid}`);
                } catch (err: any) {
                  setError(`Test registration error: ${err.code} - ${err.message}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded text-sm"
            >
              Create Test Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
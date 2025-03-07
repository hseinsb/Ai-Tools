/* eslint-disable @next/next/no-async-client-component */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getToolsByUserId } from '@/lib/tools-service-firebase';
import ToolCard from '@/components/ToolCard';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only redirect on the client-side and when auth state is determined
    if (isClient && !authLoading && !user) {
      console.log('Profile page: No authenticated user, redirecting to login');
      router.push('/login?callbackUrl=/profile');
    }
  }, [user, authLoading, router, isClient]);

  useEffect(() => {
    async function fetchUserTools() {
      if (!user) return;
      
      try {
        console.log('Fetching tools for profile page...');
        setIsLoading(true);
        
        // Get tools using our fixed function
        const userTools = await getToolsByUserId(user.uid);
        console.log(`Profile page: Found ${userTools.length} tools`);
        
        setTools(userTools as never);
      } catch (err) {
        console.error('Error fetching user tools:', err);
        setError('Failed to load your tools' as never);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchUserTools();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading]);
  
  if (authLoading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Return null while redirecting to prevent flash of content
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 text-xl font-bold">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : '?'}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{user.displayName || 'User'}</h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-semibold mb-2">Account Details</h3>
          <ul className="space-y-2">
            <li>
              <span className="text-gray-500 dark:text-gray-400">User ID: </span>
              <span className="font-mono text-sm">{user.uid}</span>
            </li>
            <li>
              <span className="text-gray-500 dark:text-gray-400">Email verified: </span>
              <span>{user.emailVerified ? 'Yes' : 'No'}</span>
            </li>
            <li>
              <span className="text-gray-500 dark:text-gray-400">Account created: </span>
              <span>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'Unknown'}</span>
            </li>
            <li>
              <span className="text-gray-500 dark:text-gray-400">Last sign in: </span>
              <span>{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Unknown'}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-3">
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>{' '}
            <span className="text-gray-900 dark:text-white">{user.email}</span>
          </p>
          {user.displayName && (
            <p>
              <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>{' '}
              <span className="text-gray-900 dark:text-white">{user.displayName}</span>
            </p>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Tools</h2>
          <Link
            href="/add"
            className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
          >
            Add New Tool
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <ToolCard 
                key={index} 
                tool={tool} 
                onUpdate={() => {
                  // Refresh tools when updated
                  if (user) getToolsByUserId(user.uid).then((updatedTools) => {
                    return setTools(updatedTools as never);
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 p-8 text-center rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't added any tools yet.
            </p>
            <Link
              href="/add"
              className="inline-flex items-center text-blue-500 hover:text-blue-700"
            >
              Add your first tool
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
// import mongoose from 'mongoose';

// Alternatively, you could use a try/catch to handle the missing dependency
try {
  // Only import mongoose if it's available
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('mongoose');

  console.warn('Mongoose not available, some functionality may be limited');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  console.warn('Mongoose not available, some functionality may be limited');
}

interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

// Helper function to check if a string is a valid MongoDB ObjectId

// Get the authenticated user from JWT token in cookies
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Get auth token from cookies - must use await with cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      console.log("No auth token found in cookies");
      return null;
    }
    
    // Verify the token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
    
    // Decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // For development, return a mock user if using dummy data
    if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true') {
      return {
        id: 'mock-user-id',
        username: 'Mock User',
        email: decoded.email || 'mock@example.com',
        createdAt: new Date().toISOString()
      };
    }
    
    // Return basic user info from token
    return {
      id: decoded.id,
      username: decoded.email.split('@')[0],
      email: decoded.email,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Auth server error:', error);
    
    // For development, return a mock user if using dummy data
    if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true') {
      return {
        id: 'mock-user-id',
        username: 'Mock User',
        email: 'mock@example.com',
        createdAt: new Date().toISOString()
      };
    }
    
    return null;
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import jwt from 'jsonwebtoken';

export async function GET(): Promise<NextResponse> {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: authUser
    });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication error' },
      { status: 500 }
    );
  }
}

// Handle login/token generation
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, uid } = await request.json();
    
    if (!email || !uid) {
      return NextResponse.json(
        { success: false, error: 'Email and UID are required' },
        { status: 400 }
      );
    }
    
    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
    const token = jwt.sign(
      { id: uid, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: uid,
        email,
        username: email.split('@')[0]
      }
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 
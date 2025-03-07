import { NextResponse } from 'next/server';
import { getUserTools } from '@/lib/tools-service-firebase';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    // Try to get user from NextAuth session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Get user email from session as ID
    const userId = session.user.email || 'dev-user-id';
    
    // Get user's tools
    const tools = await getUserTools(userId);
    return NextResponse.json({
      success: true,
      data: tools
    });
  } catch (error) {
    console.error('Error fetching user tools:', error);
    
    // For development with mock data
    if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true') {
      const mockTools = [
        {
          id: 'mock-user-tool-1',
          name: 'My ChatGPT',
          description: 'My personal AI chatbot',
          category: 'Content Generation',
          link: 'https://chat.openai.com',
          userId: 'dev-user-id',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock-user-tool-2',
          name: 'My Midjourney',
          description: 'My AI art generator',
          category: 'Image Generation',
          link: 'https://midjourney.com',
          userId: 'dev-user-id',
          createdAt: new Date().toISOString()
        }
      ];
      
      return NextResponse.json({
        success: true,
        source: 'mock-error',
        data: mockTools
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user tools' },
      { status: 500 }
    );
  }
} 
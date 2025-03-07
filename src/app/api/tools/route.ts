// app/api/tools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllTools, createTool } from '@/lib/tools-service-firebase';
import { getAuthUser } from '@/lib/auth-server';

// Add a simple caching mechanism to prevent frequent requests
let cachedTools: unknown = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export async function GET(): Promise<NextResponse> {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (cachedTools && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        data: cachedTools
      });
    }

    // Check if using dummy data
    if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true') {
      const mockTools = [
        {
          id: 'mock-1',
          name: 'ChatGPT',
          description: 'Advanced AI chatbot by OpenAI that can understand and generate human-like text.',
          category: 'Content Generation',
          link: 'https://chat.openai.com',
          userId: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock-2',
          name: 'Midjourney',
          description: 'AI art generation tool that creates images from textual descriptions.',
          category: 'Image Generation',
          link: 'https://midjourney.com',
          userId: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock-3',
          name: 'Notion AI',
          description: 'AI writing assistant integrated with Notion that helps draft, edit, and summarize content.',
          category: 'Productivity',
          link: 'https://notion.so',
          userId: 'system',
          createdAt: new Date().toISOString()
        }
      ];
      
      // Update cache
      cachedTools = mockTools;
      cacheTime = now;
      
      return NextResponse.json({
        success: true,
        source: 'mock',
        data: mockTools
      });
    }
    
    const tools = await getAllTools();
    
    // Update cache
    cachedTools = tools;
    cacheTime = now;
    
    return NextResponse.json({
      success: true,
      source: 'database',
      data: tools
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
      
    if (!user) {
      console.log("Authentication failed: No valid session or token found");
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    // Use custom auth user
    const data = await request.json();
    
    // For development with mock data
    if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true') {
      // Create a mock tool with a random ID
      const mockTool = {
        id: `mock-${Date.now()}`,
        ...data,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      
      // Invalidate cache
      cachedTools = null;
      
      return NextResponse.json(
        { success: true, data: mockTool },
        { status: 201 }
      );
    }
    
    const newTool = await createTool({
      ...data,
      userId: user.id,
    });
    
    // Invalidate cache
    cachedTools = null;
    
    return NextResponse.json(
      { success: true, data: newTool },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}


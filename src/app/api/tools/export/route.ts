import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { getAllTools } from '@/lib/tools-service-firebase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from token
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Fetch user's tools
    const userTools = await getAllTools(user.id);
    
    // Prepare data for CSV export
    const data = userTools.map((tool) => ({
      name: tool.name,
      category: tool.category,
      link: tool.link || '',
      description: tool.description
    }));
    
    // Convert to CSV format
    const csv = stringify(data, {
      header: true,
      columns: ['name', 'category', 'link', 'description']
    });
    
    // Create response with CSV content
    const response = new NextResponse(csv);
    
    // Set appropriate headers
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename="ai-tools-export-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return response;
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getToolById, updateTool, deleteTool } from '@/lib/tools-service-firebase';
import { getAuthUser } from '@/lib/auth-server';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';



// GET /api/tools/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      );
    }
    
    // Get the tool from Firestore
    const toolRef = doc(db, 'tools', id);
    const toolSnap = await getDoc(toolRef);
    
    if (!toolSnap.exists()) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }
    
    const tool = {
      id: toolSnap.id,
      ...toolSnap.data()
    };
    
    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

// PUT /api/tools/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = params.id;
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const tool = await getToolById(id);
    
    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      );
    }
    
    // Check ownership (only owner or admin can update)
    if (tool.userId !== user.id && user.id !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this tool' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    await updateTool(id, data);
    
    // Get updated tool
    const updatedTool = await getToolById(id);
    
    return NextResponse.json({
      success: true,
      data: updatedTool
    });
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

// DELETE /api/tools/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = params.id;
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const tool = await getToolById(id);
    
    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      );
    }
    
    // Check ownership (only owner or admin can delete)
    if (tool.userId !== user.id && user.id !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this tool' },
        { status: 403 }
      );
    }
    
    await deleteTool(id, user.email, user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Tool deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tool' },
      { status: 500 }
    );
  }
} 
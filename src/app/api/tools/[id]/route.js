import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request, { params }) {
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
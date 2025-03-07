import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, getDocs, where, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { Tool } from '../../types';

// Utility function to parse CSV content
function parseCSV(csvText: string) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const results = [];

  console.log(`Headers found: ${headers.join(', ')}`);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const record: Record<string, string> = {};

    for (let j = 0; j < headers.length && j < values.length; j++) {
      record[headers[j]] = values[j];
    }

    results.push(record);
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    // Extract form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log(`Import request received - userId: ${userId}, file: ${file ? 'yes' : 'no'}`);

    // Validate input
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'CSV file is required' }, { status: 400 });
    }

    // Parse the CSV file
    const csvText = await file.text();
    const parsedTools = parseCSV(csvText);

    if (parsedTools.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid tools found in CSV' }, { status: 400 });
    }

    const importedIds: string[] = [];

    // Import each tool into Firestore
    for (const toolData of parsedTools) {
      const tool = {
        name: toolData.name || 'Unnamed Tool',
        description: toolData.description || '',
        category: toolData.category || 'Other',
        link: toolData.link || '',
        userId: userId,
        pricing: toolData.pricing || 'Free',
        tags: toolData.tags ? toolData.tags.split(',') : [],
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'tools'), tool);
      importedIds.push(docRef.id);
      console.log(`Imported tool with ID: ${docRef.id}`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      count: importedIds.length,
      importedIds,
      message: `Successfully imported ${importedIds.length} tools. Please refresh the page to see them.`,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing import',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const tools = await getToolsByUserId(userId);
    return NextResponse.json({ success: true, tools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json({ success: false, error: 'Error fetching tools' }, { status: 500 });
  }
}

export async function getToolsByUserId(userId: string) {
  try {
    const toolsRef = collection(db, 'tools');
    const q = query(toolsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const tools: unknown[] = [];
    querySnapshot.forEach((doc) => {
      tools.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return tools;
  } catch (error) {
    console.error('Error getting tools by user ID:', error);
    throw error;
  }
}

export async function deleteTool(toolId: string, userId: string, userToolId: string) {
  if (!userId) {
    throw new Error('User ID is required to delete a tool');
  }
  
  if (!userToolId) {
    throw new Error('UserTool ID is required to delete a tool');
  }
  
  try {
    // Instead of deleting the tool, just update the userTool record to hide it
    const userToolRef = doc(db, 'userTools', userToolId);
    await updateDoc(userToolRef, {
      isVisible: false
    });
    
    console.log(`Tool ${toolId} hidden for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error hiding tool:', error);
    throw error;
  }
}

export async function updateTool(toolId: string, userId: string) {
  if (!userId) {
    throw new Error('User ID is required to update a tool');
  }
}

export async function createTool(tool: Tool) {
  const docRef = await addDoc(collection(db, 'tools'), tool);
  return docRef.id;
}


export async function getAllTools() {
  const toolsRef = collection(db, 'tools');
  const querySnapshot = await getDocs(toolsRef);
  return querySnapshot.docs.map(doc => doc.data());
}

export async function getUserTools(userId: string) {
  const toolsRef = collection(db, 'tools');
  const q = query(toolsRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}


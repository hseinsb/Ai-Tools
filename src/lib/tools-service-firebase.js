import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, getDocs, where, query, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

// Utility function to parse CSV content
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const results = [];

  console.log(`Headers found: ${headers.join(', ')}`);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim());
    const record = {};

    for (let j = 0; j < headers.length && j < values.length; j++) {
      record[headers[j]] = values[j];
    }

    results.push(record);
  }

  return results;
}

export async function POST(request) {
  try {
    // Extract form data from the request
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

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

    const importedIds = [];

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

export async function GET(request) {
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

export async function getToolsByUserId(userId) {
  try {
    const toolsRef = collection(db, 'tools');
    const q = query(toolsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const tools = [];
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

export async function deleteTool(toolId, userId, userToolId) {
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

export async function updateTool(toolId, userId) {
  if (!userId) {
    throw new Error('User ID is required to update a tool');
  }
}

export async function createTool(tool) {
  const docRef = await addDoc(collection(db, 'tools'), tool);
  return docRef.id;
}

// Get all tools
export async function getAllTools() {
  try {
    const toolsCollection = collection(db, 'tools');
    const toolsSnapshot = await getDocs(toolsCollection);
    return toolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
}

export async function getUserTools(userId) {
  const toolsRef = collection(db, 'tools');
  const q = query(toolsRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

// Get tool by ID
export async function getToolById(id) {
  try {
    const toolRef = doc(db, 'tools', id);
    const toolSnap = await getDoc(toolRef);
    
    if (!toolSnap.exists()) {
      return null;
    }
    
    return {
      id: toolSnap.id,
      ...toolSnap.data()
    };
  } catch (error) {
    console.error('Error fetching tool by ID:', error);
    return null;
  }
}

// Get featured tools
export async function getFeaturedTools(count = 6) {
  try {
    const toolsCollection = collection(db, 'tools');
    const q = query(
      toolsCollection,
      where('favorite', '==', true),
      limit(count)
    );
    
    const featuredSnapshot = await getDocs(q);
    return featuredSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching featured tools:', error);
    return [];
  }
}

// Get tools by category
export async function getToolsByCategory(category) {
  try {
    const toolsCollection = collection(db, 'tools');
    const q = query(
      toolsCollection,
      where('category', '==', category)
    );
    
    const categorySnapshot = await getDocs(q);
    return categorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tools by category:', error);
    return [];
  }
}

// Search tools
export async function searchTools(searchTerm) {
  try {
    const toolsCollection = collection(db, 'tools');
    const toolsSnapshot = await getDocs(toolsCollection);
    const tools = toolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Client-side search because Firestore doesn't support full-text search natively
    return tools.filter(tool => {
      const name = tool.name?.toLowerCase() || '';
      const description = tool.description?.toLowerCase() || '';
      const tags = tool.tags?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      
      return name.includes(term) || 
             description.includes(term) || 
             tags.includes(term);
    });
  } catch (error) {
    console.error('Error searching tools:', error);
    return [];
  }
}




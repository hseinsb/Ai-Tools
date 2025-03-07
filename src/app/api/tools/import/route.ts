import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

// Utility function to parse CSV content
function parseCSV(csvText: string) {
  console.log('🔥 Starting CSV parsing');
  
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    console.log('❌ No lines found in CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  console.log('🔥 CSV Headers:', headers);

  const results = [];

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

  console.log('🔥 Parsed CSV results:', results);
  return results;
}

export async function POST(request: NextRequest) {
  console.log('🔥 Import API route called');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log('🔥 Received import request:', {
      userId,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });

    if (!userId) {
      console.error('❌ No userId provided');
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ success: false, error: 'CSV file is required' }, { status: 400 });
    }

    // Read and parse the file
    const fileContent = await file.text();
    console.log('🔥 File content preview:', fileContent.substring(0, 200));

    const tools = parseCSV(fileContent);
    console.log('🔥 Parsed tools:', tools.length);

    const importedIds: string[] = [];

    // Reference to the user's tools subcollection
    const userToolsRef = collection(db, `users/${userId}/tools`);

    // Import each tool
    for (const tool of tools) {
      try {
        console.log('🔥 Processing tool:', tool);
        
        // Create the tool data object
        const toolData = {
          name: tool.name || 'Unnamed Tool',
          description: tool.description || '',
          category: tool.category || 'Other',
          link: tool.link || tool.url || tool.website || '',
          createdAt: serverTimestamp(),
          pricing: tool.pricing || 'Unknown',
          tags: tool.tags || [],
          isVisible: true
        };

        console.log('🔥 Adding tool to user collection:', toolData);

        // Add directly to the user's tools subcollection
        const docRef = await addDoc(userToolsRef, toolData);
        console.log('✅ Tool created with ID:', docRef.id);
        
        importedIds.push(docRef.id);
      } catch (toolError) {
        console.error('❌ Error importing tool:', toolError);
      }
    }

    console.log(`✅ Import complete. Successfully imported ${importedIds.length} tools`);

    // Return success response
    return NextResponse.json({
      success: true,
      count: importedIds.length,
      importedIds,
      message: `Successfully imported ${importedIds.length} tools.`,
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing import',
    }, { status: 500 });
  }
}
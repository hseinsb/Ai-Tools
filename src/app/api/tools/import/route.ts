import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { getAuthUser } from "@/lib/auth-server";

// Define a type for imported records
interface ImportedRecord {
  name?: string;
  Name?: string;
  category?: string;
  Category?: string;
  description?: string;
  Description?: string;
  link?: string;
  Link?: string;
  [key: string]: string | undefined; // Allow other string properties
}

// Improved CSV parser with better handling of quoted fields and commas
function parseCSV(csvText: string): ImportedRecord[] {
  console.log("CSV parsing input:", csvText.substring(0, 100) + "...");

  // Split by lines and filter empty lines
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    console.log("CSV has less than 2 lines, can't parse");
    return [];
  }

  // Parse the headers - trim and normalize
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  console.log("CSV headers:", headers);

  const records: ImportedRecord[] = [];

  // Process each line (starting from line 1, after headers)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split values while respecting quoted fields with commas
    const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
    const values: string[] = [];
    let match;

    while ((match = regex.exec(line + ","))) {
      values.push((match[1] || match[2] || "").trim());
    }

    // Create object from headers and values
    if (values.length > 0) {
      const record: ImportedRecord = {};

      headers.forEach((header, index) => {
        if (index < values.length) {
          record[header] = values[index];
        }
      });

      // Only add if record has at least a name
      if (record.name || record.Name) {
        records.push(record);
      }
    }
  }

  console.log(`Parsed ${records.length} records from CSV`);
  return records;
}

export async function POST(request: NextRequest) {
  try {
    console.log("--- STARTING IMPORT PROCESS ---");

    // Get the authenticated user first
    const user = await getAuthUser();
    if (!user) {
      console.log("Authentication required - no user found");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Print user details for debugging
    console.log("User from auth:", {
      id: user.id,
      uid: user.uid,
      email: user.email,
    });

    // Verify user ID exists
    if (!user.id && !user.uid) {
      console.log("Invalid user credentials - no id or uid");
      return NextResponse.json(
        { success: false, error: "Invalid user credentials" },
        { status: 403 }
      );
    }

    // Use either id or uid (whichever is available)
    const userId = user.id || user.uid;
    console.log("User ID for import:", userId);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("No file provided in request");
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("Received file:", file.name, file.size, file.type);

    // Get existing tool names (for duplicate checking only)
    const toolsQuery = query(
      collection(db, "tools"),
      where("userId", "==", userId)
    );
    const existingSnapshot = await getDocs(toolsQuery);
    const existingTools = existingSnapshot.docs.map((doc) =>
      doc.data().name?.toLowerCase()
    );
    console.log(`User already has ${existingTools.length} tools`);

    // Read the file content as text
    let records: ImportedRecord[] = [];
    const fileText = await file.text();
    console.log("File content sample:", fileText.substring(0, 100) + "...");

    // Determine if it's JSON or CSV by file extension and content
    const isJson =
      file.type === "application/json" ||
      file.name.endsWith(".json") ||
      fileText.trim().startsWith("{") ||
      fileText.trim().startsWith("[");

    if (isJson) {
      console.log("Processing as JSON file");
      try {
        const parsedJson = JSON.parse(fileText);

        // Ensure we have an array of records
        if (Array.isArray(parsedJson)) {
          records = parsedJson;
        } else if (typeof parsedJson === "object") {
          // Single object - wrap in array
          records = [parsedJson];
        } else {
          throw new Error("Invalid JSON structure - expected array or object");
        }

        console.log(`Parsed ${records.length} records from JSON`);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        return NextResponse.json(
          { success: false, error: "Invalid JSON format" },
          { status: 400 }
        );
      }
    } else {
      console.log("Processing as CSV file");
      records = parseCSV(fileText);
    }

    console.log("Records to process:", records.length);

    // Show a sample of what we'll import
    if (records.length > 0) {
      console.log("Sample record:", JSON.stringify(records[0]));
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid records found in file" },
        { status: 400 }
      );
    }

    // Import each tool with the userId
    let successCount = 0;
    let skippedCount = 0;
    const importedIds = [];

    for (const originalRecord of records) {
      console.log("Processing record:", JSON.stringify(originalRecord));

      // Extract fields with flexible case handling
      const processedRecord = {
        name: String(originalRecord.name || originalRecord.Name || "").trim(),
        category: String(
          originalRecord.category || originalRecord.Category || "Other"
        ).trim(),
        description: String(
          originalRecord.description || originalRecord.Description || ""
        ).trim(),
        link: String(originalRecord.link || originalRecord.Link || "").trim(),
      };

      console.log("Processed record:", JSON.stringify(processedRecord));

      // Skip if name is missing
      if (!processedRecord.name) {
        console.log("Skipping record with no name");
        skippedCount++;
        continue;
      }

      // Skip duplicates by name
      if (existingTools.includes(processedRecord.name.toLowerCase())) {
        console.log(`Skipping duplicate tool: ${processedRecord.name}`);
        skippedCount++;
        continue;
      }

      try {
        // Create the tool with correct fields
        const toolData = {
          name: processedRecord.name,
          description: processedRecord.description,
          category: processedRecord.category || "Other",
          link: processedRecord.link || "",
          userId: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        console.log("Creating tool:", JSON.stringify(toolData));

        // Add to Firestore
        const docRef = await addDoc(collection(db, "tools"), toolData);
        console.log(`Created tool with ID: ${docRef.id}`);
        importedIds.push(docRef.id);
        successCount++;
      } catch (error) {
        console.error("Error creating tool:", error);
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      skipped: skippedCount,
      importedIds: importedIds,
      message: `Successfully imported ${successCount} tools. Skipped ${skippedCount} tools.`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error processing file",
      },
      { status: 500 }
    );
  }
}

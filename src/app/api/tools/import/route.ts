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

// Simple CSV parser function to replace csv-parse
function parseCSV(csvText: string) {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  return lines.slice(1).map((line) => {
    const values = line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((v) => v.trim().replace(/^"|"$/g, ""));

    return headers.reduce((obj: Record<string, string>, header, index) => {
      obj[header] = values[index] || "";
      return obj;
    }, {});
  });
}

export async function POST(request: NextRequest) {
  try {
    // Add debug log
    console.log("--- STARTING IMPORT PROCESS ---");

    // Get the authenticated user first
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user ID exists
    if (!user.id && !user.uid) {
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
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("Received file:", file.name, file.size, file.type);

    // First, get all existing tools to avoid duplicates
    const toolsQuery = query(
      collection(db, "tools"),
      where("userId", "==", userId)
    );
    const existingSnapshot = await getDocs(toolsQuery);
    const existingTools = existingSnapshot.docs.map((doc) =>
      doc.data().name?.toLowerCase()
    );
    console.log(`User already has ${existingTools.length} tools`);

    let records: any[] = [];
    const fileText = await file.text();

    // Determine if it's JSON or CSV by checking file type and content
    const isJson =
      file.type === "application/json" ||
      file.name.endsWith(".json") ||
      fileText.trim().startsWith("{") ||
      fileText.trim().startsWith("[");

    if (isJson) {
      console.log("Processing as JSON file");
      try {
        records = JSON.parse(fileText);
        // If it's a single object, wrap it in an array
        if (!Array.isArray(records)) {
          records = [records];
        }
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

    console.log("Parsed records count:", records.length);

    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid data found in file" },
        { status: 400 }
      );
    }

    console.log(`Found ${records.length} records to import`);

    // Import each tool with the userId
    let successCount = 0;
    let skippedCount = 0;
    const importedIds = [];

    for (const originalRecord of records) {
      console.log("Processing record:", originalRecord);

      // Modify the validation to be more flexible
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

      // More lenient validation
      if (!processedRecord.name) {
        skippedCount++;
        continue;
      }

      // Skip duplicates
      if (existingTools.includes(processedRecord.name.trim().toLowerCase())) {
        console.log(`Skipping duplicate tool: ${processedRecord.name}`);
        skippedCount++;
        continue;
      }

      try {
        // THIS IS CRITICAL: Match EXACT field names from the regular tool creation
        const toolData = {
          name: processedRecord.name,
          description: processedRecord.description,
          category: processedRecord.category,
          link: processedRecord.link,
          userId: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        console.log(
          `Creating imported tool:`,
          JSON.stringify({
            ...toolData,
            createdAt: "SERVER_TIMESTAMP",
          })
        );

        // Add to Firestore
        const docRef = await addDoc(collection(db, "tools"), toolData);
        console.log(`Created imported tool with ID: ${docRef.id}`);
        importedIds.push(docRef.id);

        console.log("Importing for user:", userId);
        console.log("Created document:", docRef.id);

        successCount++;
      } catch (error) {
        console.error("Firestore write error:", error);
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

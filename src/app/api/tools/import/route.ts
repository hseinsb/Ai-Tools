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

    return headers.reduce((obj: any, header, index) => {
      obj[header] = values[index] || "";
      return obj;
    }, {});
  });
}

export async function POST(request: NextRequest) {
  try {
    // Add debug log
    console.log("--- STARTING IMPORT PROCESS ---");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    console.log("Received file:", file.name, file.size, file.type);

    // Add CSV content debug
    const csvText = await file.text();
    console.log(
      "Raw CSV content (first 200 chars):",
      csvText.substring(0, 200)
    );

    const records = parseCSV(csvText);
    console.log("Parsed records count:", records.length);

    // Add record processing debug
    records.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, JSON.stringify(record));
    });

    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid data found in CSV" },
        { status: 400 }
      );
    }

    console.log(`Found ${records.length} records to import`);

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

    // Import each tool with the userId
    let successCount = 0;
    let skippedCount = 0;
    const importedIds = [];

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify Firebase UID exists in the user object
    if (!user.id) {
      return NextResponse.json(
        { success: false, error: "Invalid user credentials" },
        { status: 403 }
      );
    }
    const userId = user.id; // or user.uid depending on your auth setup

    for (const record of records) {
      console.log("Processing record:", record);

      // Modify the validation to be more flexible
      const record = {
        name: String(record.name || record.Name || "").trim(),
        category: String(record.category || record.Category || "Other").trim(),
        description: String(
          record.description || record.Description || ""
        ).trim(),
        link: String(record.link || record.Link || "").trim(),
      };

      // More lenient validation
      if (!record.name) {
        skippedCount++;
        continue;
      }

      // Skip duplicates
      if (existingTools.includes(record.name.trim().toLowerCase())) {
        console.log(`Skipping duplicate tool: ${record.name}`);
        skippedCount++;
        continue;
      }

      try {
        // THIS IS CRITICAL: Match EXACT field names from the regular tool creation
        const toolData = {
          name: record.name,
          description: record.description,
          category: record.category,
          link: record.link,
          userId: user.uid,
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
        const docRef = await addDoc(collection(db, "tools"), {
          name: record.name,
          category: record.category,
          description: record.description,
          link: record.link,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log(`Created imported tool with ID: ${docRef.id}`);
        importedIds.push(docRef.id);

        console.log("Importing for user:", userId);
        console.log("Processed record:", record);
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

import React, { useState, useRef } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/AuthProvider";
import Cookies from "js-cookie";

export default function ToolsToolbar() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Fetch all tools from Firestore
      const toolsCollection = collection(db, "tools");
      const toolsSnapshot = await getDocs(toolsCollection);
      const tools = toolsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Create a JSON file to download
      const dataStr = JSON.stringify(tools, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
        dataStr
      )}`;

      // Create download link and trigger download
      const exportFileDefaultName = `ai-tools-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export tools.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    // Create file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // User must be logged in to import
    if (!user) {
      alert("You must be logged in to import tools");
      return;
    }

    // Set auth cookie to ensure the server recognizes the user
    // Include both UID and email for better authentication
    if (user) {
      console.log("Setting auth cookie for import with user:", user.uid);
      Cookies.set(
        "firebase-user-credentials",
        JSON.stringify({
          uid: user.uid,
          email: user.email || `${user.uid}@example.com`,
        }),
        { expires: 7, path: "/" }
      );
    }

    console.log(`Selected file: ${file.name} (${file.size} bytes)`);

    // Check file extension
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    const isJSON = file.name.toLowerCase().endsWith(".json");

    if (!isCSV && !isJSON) {
      alert(
        "Please select a CSV or JSON file (must have .csv or .json extension)"
      );
      return;
    }

    try {
      setIsImporting(true);

      // Create form data for the file upload
      const formData = new FormData();
      formData.append("file", file);

      console.log(
        `Sending ${isCSV ? "CSV" : "JSON"} import with user ID: ${user.uid}`
      );

      // Make the API request with credentials included
      const response = await fetch("/api/tools/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("Response status:", response.status);

      const result = await response.json();
      console.log("Import response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to import tools");
      }

      // Display success message
      alert(
        `${
          result.message ||
          `Successfully imported ${result.count} tools${result.skipped > 0 ? ` (${result.skipped} skipped)` : ""}.`
        }\n\nThe page will now reload to show your imported tools.`
      );

      // Clear input and refresh page
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Force a reload with cache busting
      window.location.href = "/?reload=" + Date.now();
    } catch (error) {
      console.error("Import failed:", error);
      alert(error instanceof Error ? error.message : "Failed to import tools.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex justify-end space-x-3 mb-6">
      <Link href="/add" className="btn btn-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add New Tool
      </Link>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json,.csv"
        onChange={handleFileSelected}
      />

      <button
        onClick={handleImport}
        className="btn btn-outline"
        disabled={isImporting}
      >
        {isImporting ? (
          <>
            <span className="spinner mr-2"></span>
            Importing...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Import Tools
          </>
        )}
      </button>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="btn btn-outline"
      >
        {isExporting ? (
          <>
            <span className="spinner mr-2"></span>
            Exporting...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export Tools
          </>
        )}
      </button>
    </div>
  );
}

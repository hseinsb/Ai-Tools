"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Cookies from "js-cookie";

interface ImportExportToolsProps {
  onImportSuccess?: () => void;
}

export default function ImportExportTools({
  onImportSuccess,
}: ImportExportToolsProps) {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [importFormat, setImportFormat] = useState<string>("csv"); // Default to CSV
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure authentication cookie is set whenever user changes
  useEffect(() => {
    if (user) {
      console.log("Setting auth cookie in ImportExportTools");
      Cookies.set(
        "firebase-user-credentials",
        JSON.stringify({
          uid: user.uid,
          email: user.email || `${user.uid}@example.com`,
        }),
        { expires: 7, path: "/" }
      );
    }
  }, [user]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("Selected file:", file.name, file.type, file.size);

      // Clear previous errors
      setImportError("");

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImportError("File size exceeds 5MB limit");
        return;
      }

      // Check file type based on extension
      const isCSV = file.name.toLowerCase().endsWith(".csv");
      const isJSON = file.name.toLowerCase().endsWith(".json");

      if (!isCSV && !isJSON) {
        setImportError(
          "Please upload a CSV or JSON file (must have .csv or .json extension)"
        );
        return;
      }

      // Set format based on file extension
      setImportFormat(isCSV ? "csv" : "json");

      // Proceed with import
      handleImport(file);
    }
  };

  const handleImport = async (file: File) => {
    if (!file) {
      setImportError("No file selected");
      return;
    }

    // User must be logged in to import
    if (!user) {
      setImportError("You must be logged in to import tools");
      return;
    }

    console.log(
      `Starting import process with file: ${file.name} (${file.size} bytes)`
    );

    // Ensure auth cookie is set right before import with complete user info
    if (user) {
      Cookies.set(
        "firebase-user-credentials",
        JSON.stringify({
          uid: user.uid,
          email: user.email || `${user.uid}@example.com`,
        }),
        { expires: 7, path: "/" }
      );
    }

    // Double-check file extension
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    const isJSON = file.name.toLowerCase().endsWith(".json");

    if (!isCSV && !isJSON) {
      setImportError("Please upload a CSV or JSON file");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log(
        `Sending ${isCSV ? "CSV" : "JSON"} import with user ID: ${user.uid}`
      );

      const res = await fetch("/api/tools/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("Server response status:", res.status);

      const data = await res.json();
      console.log("Server response data:", data);

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      if (data.success) {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Call success callback if provided
        if (onImportSuccess) {
          onImportSuccess();
        }

        // Alert success
        alert(
          `${
            data.message ||
            `Successfully imported ${data.count} tools${data.skipped > 0 ? ` (${data.skipped} skipped)` : ""}.`
          }\n\nThe page will now reload to show your imported tools.`
        );

        // Force a reload with cache busting
        window.location.href = "/?reload=" + Date.now();
      } else {
        setImportError(data.error || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportError(
        error instanceof Error ? error.message : "Failed to import file"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const res = await fetch("/api/tools/export", {
        method: "GET",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Export failed");
      }

      // Get the CSV content
      const csvContent = await res.text();

      // Create a blob from the CSV content
      const blob = new Blob([csvContent], { type: "text/csv" });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-tools-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(error instanceof Error ? error.message : "Failed to export tools");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <h2 className="text-xl font-semibold mb-4">Import/Export Tools</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-md font-medium mb-2">Import Tools</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Upload a CSV or JSON file to bulk import AI tools.
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              View format
            </button>
          </p>

          <div className="flex items-center mb-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importFormat"
                  value="csv"
                  checked={importFormat === "csv"}
                  onChange={() => setImportFormat("csv")}
                  className="mr-1"
                />
                <span className="text-sm">CSV</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importFormat"
                  value="json"
                  checked={importFormat === "json"}
                  onChange={() => setImportFormat("json")}
                  className="mr-1"
                />
                <span className="text-sm">JSON</span>
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              accept={importFormat === "csv" ? ".csv" : ".json"}
              onChange={handleFileChange}
              className="hidden"
              id="import-file-input"
            />
            <label
              htmlFor="import-file-input"
              className="btn btn-outline cursor-pointer"
            >
              {isImporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Select {importFormat.toUpperCase()} file
                </>
              )}
            </label>
          </div>

          {importError && (
            <p className="text-red-500 text-sm mt-2">{importError}</p>
          )}
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">Export to CSV</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Export your AI tools collection as a CSV file.
          </p>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn btn-outline"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Export as CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">CSV Format</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your CSV file should have the following columns:
            </p>

            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md font-mono text-xs overflow-auto">
              name,category,link,description
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 my-3">
              Example:
            </p>

            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md font-mono text-xs overflow-auto mb-4">
              ChatGPT,Chatbot,https://chat.openai.com,A powerful AI chatbot for
              natural language conversations Midjourney,Image
              Generation,https://midjourney.com,AI tool that generates images
              from text descriptions GitHub Copilot,Code
              Assistant,https://github.com/features/copilot,AI pair programmer
              that suggests code as you type
            </pre>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

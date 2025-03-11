"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useAuth } from "@/components/AuthProvider";

interface ImportExportToolsProps {
  onImportSuccess?: () => void;
}

export default function ImportExportTools({}: ImportExportToolsProps) {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImport(e.target.files[0]);
    }
  };

  const handleImport = async (file: File) => {
    if (!file) return;

    // User must be logged in to import
    if (!user) {
      setImportError("You must be logged in to import tools");
      return;
    }

    // Check file type - only accept CSV
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setImportError("Please upload a CSV file");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Sending import with userId:", user.uid);

      const res = await fetch("/api/tools/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Import failed: ${errorText}`);
      }

      const data = await res.json();

      if (data.success) {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Alert success and prepare for reload
        alert(
          `${
            data.message || `Successfully imported ${data.count} tools.`
          }\n\nThe page will now reload to show your imported tools.`
        );

        // Force a hard reload - THREE different approaches to ensure it works
        console.log("Forcing reload to show imported tools");

        // 1. Clear any cache
        if ("caches" in window) {
          try {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
            });
          } catch (e) {
            console.error("Cache clear error:", e);
          }
        }

        // 2. Use location.reload() with forceGet parameter
        setTimeout(() => {
          window.location.href = "/?reload=" + Date.now();
          setTimeout(() => window.location.reload(), 100);
        }, 500);
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
          <h3 className="text-md font-medium mb-2">Import from CSV</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Upload a CSV file to bulk import AI tools.
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              View format
            </button>
          </p>

          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
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
                  Select CSV file
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

import React, { useState } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function ToolsToolbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e) => {
      setIsImporting(true);
      try {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            if (!event.target) {
              throw new Error("Failed to read file: event target is null");
            }

            const importedTools = JSON.parse(event.target.result as string);

            for (const tool of importedTools) {
              await addDoc(collection(db, "tools"), {
                ...tool,
                userId: user?.uid ?? "",
                createdAt: serverTimestamp(),
              });
            }

            alert("Import successful!");

            router.refresh();
          } catch (error) {
            console.error("Import failed:", error);
            alert("Failed to import tools.");
          } finally {
            setIsImporting(false);
          }
        };

        reader.readAsText(file);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import tools.");
        setIsImporting(false);
      }
    };

    input.click();
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

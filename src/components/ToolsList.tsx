"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useAuth } from "./AuthProvider";
import ToolCard from "./ToolCard";
import { deleteTool } from "@/lib/tools-service-firebase";

// Simple mock data that will always work
const EMERGENCY_MOCK_TOOLS = [
  {
    id: "mock-1",
    name: "Example AI Tool 1",
    description:
      "This is a mock tool that appears when Firebase data cannot be loaded.",
    category: "Productivity",
    link: "https://example.com",
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-2",
    name: "Example AI Tool 2",
    description: "Another mock tool for demonstration purposes.",
    category: "Content Creation",
    link: "https://example.com",
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-3",
    name: "Example AI Tool 3",
    description: "A third mock tool to show when Firebase fails.",
    category: "Development",
    link: "https://example.com",
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
];

// Add this interface to accept viewMode prop
interface ToolsListProps {
  category?: string;
  viewMode?: "flat" | "byCategory";
}

export default function ToolsList({
  category,
  viewMode: propViewMode,
}: ToolsListProps) {
  const [tools, setTools] = useState(EMERGENCY_MOCK_TOOLS); // Start with mock data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    "All",
    "Productivity",
    "Content Creation",
    "Development",
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    category || "All"
  );
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  // Add local viewMode state that defaults to prop or 'flat'
  const [viewMode, setViewMode] = useState<"flat" | "byCategory">(
    propViewMode || "flat"
  );
  const { user } = useAuth();
  const isMounted = useRef(true);

  // Update local viewMode when prop changes
  useEffect(() => {
    if (propViewMode) {
      setViewMode(propViewMode);
    }
  }, [propViewMode]);

  // Simplified fetch function
  const fetchTools = useCallback(async () => {
    try {
      console.log("Fetching tools for user:", user?.uid);

      if (!db) {
        console.error("Firebase DB not available");
        setError("Firebase connection issue. Showing example data.");
        setLoading(false);
        return;
      }

      // Create a base query
      const q = query(
        collection(db, "tools"),
        where("userId", "==", user?.uid || ""),
        orderBy("createdAt", "desc")
      );

      console.log("Firestore query:", q);

      const querySnapshot = await getDocs(q);
      console.log("Query returned", querySnapshot.docs.length, "documents");

      querySnapshot.docs.forEach((doc) => {
        console.log("Document:", doc.id, "=>", doc.data());
      });

      if (querySnapshot.empty) {
        console.log("No tools found in database for this user");
        setError("No tools found. Showing example data.");
        setTools(EMERGENCY_MOCK_TOOLS); // Show example data when no tools found
        setLoading(false);
        return;
      }

      const fetchedTools = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unnamed Tool",
          description: data.description || "No description",
          category: data.category || "Other",
          link: data.link || "#",
          userId: data.userId || "",
          createdAt: data.createdAt
            ? new Date().toISOString()
            : new Date().toISOString(),
        };
      });

      if (fetchedTools.length > 0) {
        console.log(`Fetched ${fetchedTools.length} tools successfully`);

        // Extract categories
        const uniqueCategories = ["All"];
        fetchedTools.forEach((tool) => {
          if (tool.category && !uniqueCategories.includes(tool.category)) {
            uniqueCategories.push(tool.category);
          }
        });

        setCategories(uniqueCategories);

        // Filter by category if needed
        let filtered = fetchedTools;
        if (selectedCategory !== "All") {
          filtered = fetchedTools.filter(
            (tool) => tool.category === selectedCategory
          );
        }

        setTools(filtered);
      } else {
        // Fallback to mock data
        setTools(EMERGENCY_MOCK_TOOLS);
        setError("No tools available. Showing example data.");
      }
    } catch (err) {
      console.error("Firestore query error:", err);
      setError("Failed to load tools");
      setLoading(false);
    }
  }, [selectedCategory, user]);

  // Try to fetch real data, but with a quick timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.log("Loading timeout - using mock data");
      }
    }, 3000);

    // Try to fetch, but don't wait too long
    fetchTools().catch((err) => {
      console.error("Failed to fetch tools:", err);
      setLoading(false);
    });

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [fetchTools]);

  // Emergency button to reset data
  const resetData = () => {
    setTools(EMERGENCY_MOCK_TOOLS);
    setLoading(false);
    setError("Using emergency mock data.");
  };

  // Handle toggling of selection mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    // Clear selections when exiting select mode
    if (selectMode) {
      setSelectedTools([]);
    }
  };

  // Toggle selection of a tool
  const toggleToolSelection = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((id) => id !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  // Select or deselect all visible tools
  const toggleSelectAll = () => {
    if (selectedTools.length === tools.length) {
      // If all are selected, deselect all
      setSelectedTools([]);
    } else {
      // Otherwise select all visible tools
      setSelectedTools(tools.map((tool) => tool.id));
    }
  };

  // Group tools by category for the byCategory view
  const toolsByCategory = tools.reduce(
    (acc, tool) => {
      const category = tool.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tool);
      return acc;
    },
    {} as Record<string, typeof tools>
  );

  // Filter tools based on selected category
  const displayTools =
    selectedCategory === "All"
      ? tools
      : tools.filter((tool) => tool.category === selectedCategory);

  // Add this new function for bulk deletion
  const handleBulkDelete = async () => {
    if (selectedTools.length === 0 || !user) return;

    if (
      confirm(`Are you sure you want to delete ${selectedTools.length} tools?`)
    ) {
      try {
        // Only process tools that belong to the current user
        for (const toolId of selectedTools) {
          // Find the tool in our local state
          const tool = tools.find((t) => t.id === toolId);

          // Only delete if this user owns it
          if (tool && tool.userId === user.uid) {
            await deleteTool(toolId, user.uid);
          }
        }

        // Clear selection and refresh
        setSelectedTools([]);
        fetchTools();
      } catch (error) {
        console.error("Error deleting tools:", error);
      }
    }
  };

  // Add this new function for exporting tools
  const handleExport = useCallback(() => {
    if (selectedTools.length === 0) return;

    try {
      // Find all selected tools' data
      const toolsToExport = tools.filter((tool) =>
        selectedTools.includes(tool.id)
      );

      // Convert to JSON
      const exportData = JSON.stringify(toolsToExport, null, 2);

      // Create a blob
      const blob = new Blob([exportData], { type: "application/json" });

      // Create a download URL
      const url = URL.createObjectURL(blob);

      // Create a download link and click it
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-tools-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      alert(`Successfully exported ${selectedTools.length} tools.`);

      // Optional: clear selection after export
      // setSelectedTools([]);
    } catch (error) {
      console.error("Error exporting tools:", error);
      alert("Failed to export tools. Please try again.");
    }
  }, [selectedTools, tools]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <button
          onClick={resetData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Cancel Loading
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>{error}</p>
          <button onClick={resetData} className="mt-2 underline text-blue-600">
            Reset Data
          </button>
        </div>
      )}

      {/* Top toolbar with category filters and selection controls */}
      <div className="mb-4 flex flex-wrap justify-between items-center">
        {/* Only show category filters in flat view */}
        {viewMode === "flat" && (
          <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === cat
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Selection mode controls */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={toggleSelectMode}
            className={`px-3 py-1 rounded text-sm flex items-center ${
              selectMode
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            {selectMode ? "Cancel Selection" : "Select Tools"}
          </button>

          {selectMode && (
            <>
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
              >
                {selectedTools.length === displayTools.length
                  ? "Deselect All"
                  : "Select All"}
              </button>

              <span className="text-sm font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-300">
                {selectedTools.length} selected
              </span>

              {selectedTools.length > 0 && (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    onClick={handleExport}
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Export
                    </span>
                  </button>

                  <button
                    className="px-3 py-1 rounded text-sm bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm"
                    onClick={handleBulkDelete}
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Flat view mode */}
      {viewMode === "flat" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onUpdate={fetchTools}
              selectMode={selectMode}
              isSelected={selectedTools.includes(tool.id)}
              onSelectToggle={() => toggleToolSelection(tool.id)}
            />
          ))}
        </div>
      )}

      {/* Category grouped view mode */}
      {viewMode === "byCategory" && (
        <div className="space-y-8">
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <div
              key={category}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                <span className="h-4 w-4 rounded-sm bg-blue-500 mr-2"></span>
                {category}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({categoryTools.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onUpdate={fetchTools}
                    selectMode={selectMode}
                    isSelected={selectedTools.includes(tool.id)}
                    onSelectToggle={() => toggleToolSelection(tool.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {((viewMode === "flat" && displayTools.length === 0) ||
        (viewMode === "byCategory" &&
          Object.keys(toolsByCategory).length === 0)) &&
        !loading && (
          <div className="text-center py-10">
            <p className="text-gray-500">
              No tools found. Try a different category or add new tools.
            </p>
            <button
              onClick={resetData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Show Example Tools
            </button>
          </div>
        )}
    </div>
  );
}

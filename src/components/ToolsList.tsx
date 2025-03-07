"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs, query, where, Timestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useAuth } from './AuthProvider';
import ToolCard from './ToolCard';

// Simple mock data that will always work

// Add this interface to accept viewMode prop
interface ToolsListProps {
  category?: string;
  viewMode?: 'flat' | 'byCategory';
}

// Define a proper Tool interface to ensure consistent typing
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  link: string;
  createdAt: string | Date | Timestamp;
  pricing?: string;
  tags?: string[];
  isVisible?: boolean;
}

export default function ToolsList({ category, viewMode: propViewMode }: ToolsListProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories] = useState<string[]>(['All', 'Productivity', 'Content Creation', 'Development']);
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'All');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [toolsByCategory, setToolsByCategory] = useState<Record<string, Tool[]>>({});
  const [viewMode, setViewMode] = useState<'flat' | 'byCategory'>(propViewMode || 'flat');
  const { user } = useAuth();
  const isMounted = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter tools based on selected category
  const displayTools = selectedCategory === 'All' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

  // Function to fetch tools from Firestore
  const fetchTools = useCallback(async () => {
    console.log('🔥 fetchTools called, user:', user?.uid);
    
    if (!user?.uid) {
      console.log('No user ID available, skipping fetch');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Set a timeout to prevent infinite loading
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && loading) {
        console.log('Loading timeout reached, showing error');
        setLoading(false);
        setError('Loading took too long. Please try again.');
      }
    }, 10000); // 10 second timeout
    
    try {
      // Get tools directly from the user's subcollection
      console.log('🔥 Querying user tools subcollection');
      const userToolsRef = collection(db, `users/${user.uid}/tools`);
      const q = query(
        userToolsRef, 
        where('isVisible', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`🔥 Found ${querySnapshot.size} tools for user`);
      
      if (querySnapshot.empty) {
        console.log('No tools found for user');
        setTools([]);
        setToolsByCategory({});
        setLoading(false);
        return;
      }
      
      const fetchedTools: Tool[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔥 Tool data:', data);
        
        // Convert Timestamp to string if needed
        let createdAtValue: string;
        if (data.createdAt instanceof Timestamp) {
          createdAtValue = data.createdAt.toDate().toISOString();
        } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAtValue = data.createdAt.toDate().toISOString();
        } else {
          createdAtValue = new Date().toISOString();
        }
        
        fetchedTools.push({
          id: doc.id,
          name: data.name || 'Unnamed Tool',
          description: data.description || '',
          category: data.category || 'Other',
          link: data.link || '',
          createdAt: createdAtValue,
          pricing: data.pricing || 'Unknown',
          tags: data.tags || []
        });
      });
      
      console.log('🔥 Processed tools:', fetchedTools);
      
      setTools(fetchedTools);
      
      // Group tools by category
      const byCategory: Record<string, Tool[]> = {};
      fetchedTools.forEach(tool => {
        const category = tool.category || 'Other';
        if (!byCategory[category]) {
          byCategory[category] = [];
        }
        byCategory[category].push(tool);
      });
      
      setToolsByCategory(byCategory);
      
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError('Failed to load tools. Please try again.');
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setLoading(false);
    }
  }, [user]);

  // Reset data function to show example tools
  const resetData = () => {
    setError(null);
    setLoading(false);
    
    // Set some example tools
    const mockTools = [
      {
        id: 'mock-1',
        name: 'ChatGPT',
        description: 'AI assistant that can understand and generate human-like text based on context.',
        category: 'AI Chat',
        link: 'https://chat.openai.com',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-2',
        name: 'Midjourney',
        description: 'AI art generation tool that creates images from text descriptions.',
        category: 'Image Generation',
        link: 'https://midjourney.com',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-3',
        name: 'GitHub Copilot',
        description: 'AI pair programmer that suggests code as you type.',
        category: 'Development',
        link: 'https://github.com/features/copilot',
        createdAt: new Date().toISOString()
      }
    ];
    
    setTools(mockTools);
    
    // Group mock tools by category
    const byCategory: Record<string, Tool[]> = {};
    mockTools.forEach(tool => {
      const category = tool.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(tool);
    });
    
    setToolsByCategory(byCategory);
  };

  // Toggle tool selection
  const toggleToolSelection = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  // Toggle select all tools
  const toggleSelectAll = () => {
    if (selectedTools.length === tools.length) {
      setSelectedTools([]);
    } else {
      setSelectedTools(tools.map(tool => tool.id));
    }
  };

  // Function to handle bulk deletion
  const handleBulkDelete = async () => {
    if (!user?.uid) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedTools.length} tools?`)) {
      return;
    }
    
    try {
      // Delete each selected tool
      for (const toolId of selectedTools) {
        const toolRef = doc(db, `users/${user.uid}/tools/${toolId}`);
        await updateDoc(toolRef, {
          isVisible: false
        });
      }
      
      // Clear selection and refresh
      setSelectedTools([]);
      fetchTools();
    } catch (error) {
      console.error('Error deleting tools:', error);
      alert('Failed to delete tools. Please try again.');
    }
  };

  // Function to handle delete all
  const handleDeleteAll = async () => {
    if (!user?.uid) return;
    
    if (!confirm(`Are you sure you want to delete ALL tools? This cannot be undone.`)) {
      return;
    }
    
    try {
      // Delete all tools
      const toolIds = tools.map(tool => tool.id);
      for (const toolId of toolIds) {
        const toolRef = doc(db, `users/${user.uid}/tools/${toolId}`);
        await updateDoc(toolRef, {
          isVisible: false
        });
      }
      
      // Clear selection and refresh
      setSelectedTools([]);
      fetchTools();
    } catch (error) {
      console.error('Error deleting all tools:', error);
      alert('Failed to delete all tools. Please try again.');
    }
  };

  // Function to select all tools
  const handleSelectAll = () => {
    const allToolIds = tools.map(tool => tool.id);
    setSelectedTools(allToolIds);
  };

  // Function to exit select mode
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedTools([]);
  };

  // Handle export selected tools
  const handleExport = () => {
    // Implementation for export
    console.log('Export:', selectedTools);
  };

  // Effect to fetch tools when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, fetching tools');
      fetchTools();
    }
  }, [user, fetchTools]);

  // Effect to clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Listen for toolsImported event
  useEffect(() => {
    const handleToolsImported = () => {
      console.log('🔥 Tools imported event received, refreshing tools');
      fetchTools();
    };
    
    window.addEventListener('toolsImported', handleToolsImported);
    
    return () => {
      window.removeEventListener('toolsImported', handleToolsImported);
    };
  }, [fetchTools]);

  // Update category when prop changes
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);

  // Add this inside the component, near the other useEffect hooks:
  useEffect(() => {
    const handleToggleSelectMode = () => {
      setSelectMode(prevMode => !prevMode);
      // Clear selections when exiting select mode
      if (selectMode) {
        setSelectedTools([]);
      }
    };
    
    window.addEventListener('toggleSelectMode', handleToggleSelectMode);
    
    return () => {
      window.removeEventListener('toggleSelectMode', handleToggleSelectMode);
    };
  }, [selectMode]);

  // Add this useEffect to the ToolsList component
  useEffect(() => {
    const handleSetViewMode = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.mode) {
        setViewMode(customEvent.detail.mode);
      }
    };
    
    window.addEventListener('setViewMode', handleSetViewMode);
    
    return () => {
      window.removeEventListener('setViewMode', handleSetViewMode);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 mb-4">Loading your tools...</p>
        <button 
          onClick={() => {
            setLoading(false);
            resetData();
          }}
          className="text-blue-500 hover:underline"
        >
          Taking too long? Click here
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <button 
          onClick={fetchTools}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
        >
          Try Again
        </button>
        <button 
          onClick={resetData}
          className="text-blue-500 hover:underline"
        >
          Show Example Tools
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Remove the duplicate view mode and category selector */}
      {/* Only keep the selection mode controls */}
      {selectMode && (
        <div className="flex flex-wrap justify-between items-center bg-gray-100 p-2 rounded-md">
          <div className="text-sm font-medium mb-2 sm:mb-0">
            {selectedTools.length} tools selected
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedTools([])}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              disabled={selectedTools.length === 0}
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              disabled={selectedTools.length === 0}
            >
              Delete Selected
            </button>
            <button
              onClick={handleDeleteAll}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Delete All
            </button>
            <button
              onClick={exitSelectMode}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={fetchTools}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs ml-2"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Flat view mode */}
      {viewMode === 'flat' && !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTools.map((tool: Tool) => (
            <ToolCard
              key={tool.id}
              tool={{
                ...tool,
                createdAt: typeof tool.createdAt === 'string' ? tool.createdAt : new Date().toISOString()
              }}
              onUpdate={fetchTools}
              selectMode={selectMode}
              isSelected={selectedTools.includes(tool.id)}
              onSelectToggle={() => toggleToolSelection(tool.id)}
            />
          ))}
        </div>
      )}
      
      {/* Category grouped view mode */}
      {viewMode === 'byCategory' && !loading && !error && (
        <div className="space-y-8">
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <div key={category} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                <span className="h-4 w-4 rounded-sm bg-blue-500 mr-2"></span>
                {category} 
                <span className="ml-2 text-sm font-normal text-gray-500">({categoryTools.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTools.map((tool: Tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={{
                      ...tool,
                      createdAt: typeof tool.createdAt === 'string' ? tool.createdAt : new Date().toISOString()
                    }}
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
      {((viewMode === 'flat' && displayTools.length === 0) || 
        (viewMode === 'byCategory' && Object.keys(toolsByCategory).length === 0)) && 
       !loading && !error && (
        <div className="text-center py-10">
          <p className="text-gray-500">No tools found. Try a different category or add new tools.</p>
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



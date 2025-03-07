import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export default function ToolsToolbar() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean, count: number} | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'flat' | 'byCategory'>('flat');
  const [ledPosition, setLedPosition] = useState(-5); // Start off-screen
  const { user } = useAuth();
  
  // LED animation effect
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setLedPosition(prev => {
        // Reset to start when it reaches the end
        if (prev > 100) return -5;
        return prev + 1;
      });
    }, 30); // Update every 30ms for smooth animation
    
    return () => clearInterval(animationInterval);
  }, []);
  
  // Function to toggle select mode
  const toggleSelectMode = () => {
    // Dispatch a custom event to notify ToolsList to toggle select mode
    const event = new CustomEvent('toggleSelectMode');
    window.dispatchEvent(event);
  };
  
  // Function to set view mode
  const setViewMode = (mode: 'flat' | 'byCategory') => {
    setActiveViewMode(mode);
    // Dispatch a custom event to notify ToolsList to change view mode
    const event = new CustomEvent('setViewMode', { detail: { mode } });
    window.dispatchEvent(event);
  };
  
  // Listen for view mode changes from other components
  useEffect(() => {
    const handleSetViewMode = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.mode) {
        setActiveViewMode(customEvent.detail.mode);
      }
    };
    
    window.addEventListener('setViewMode', handleSetViewMode);
    
    return () => {
      window.removeEventListener('setViewMode', handleSetViewMode);
    };
  }, []);
  
  const handleExport = async () => {
    if (!user) {
      alert('You must be logged in to export tools');
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Fetch all visible tools for the user
      const toolsRef = collection(db, `users/${user.uid}/tools`);
      const q = query(toolsRef, where("isVisible", "!=", false));
      const querySnapshot = await getDocs(q);
      
      // Convert the tools to CSV format
      const tools = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          link: data.link || '',
          pricing: data.pricing || '',
          tags: Array.isArray(data.tags) ? data.tags.join(' ') : data.tags || ''
        };
      });
      
      if (tools.length === 0) {
        alert('No tools to export');
        return;
      }
      
      // Create CSV header
      const headers = ['name', 'description', 'category', 'link', 'pricing', 'tags'];
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add each tool as a row
      tools.forEach(tool => {
        const row = headers.map(header => {
          // Escape commas and quotes in the field
          const field = String(tool[header as keyof typeof tool] || '');
          const escapedField = field.includes(',') || field.includes('"') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field;
          return escapedField;
        });
        csvContent += row.join(',') + '\n';
      });
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'ai-tools.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export tools. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    if (!user) {
      alert('You must be logged in to import tools');
      return;
    }
    
    try {
      setIsImporting(true);
      setImportResult(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.uid);
      
      const response = await fetch('/api/tools/import', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      console.log('Import result:', result);
      
      if (result.success) {
        setImportResult({
          success: true,
          count: result.count
        });
        
        // Dispatch a custom event to notify ToolsList to refresh
        const event = new CustomEvent('toolsImported', {
          detail: { count: result.count }
        });
        window.dispatchEvent(event);
      } else {
        setImportResult({
          success: false,
          count: 0
        });
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
      // Reset the file input
      e.target.value = '';
    }
  };
  
  return (
    <div className="mb-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0 sm:space-x-8">
        {/* View mode toggle */}
        <div className="bg-gray-200 p-1 rounded-lg flex">
          <button
            onClick={() => setViewMode('flat')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeViewMode === 'flat' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Tools
          </button>
          <button
            onClick={() => setViewMode('byCategory')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeViewMode === 'byCategory' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-300'
            }`}
          >
            By Category
          </button>
        </div>
        
        <div className="flex space-x-2">
          <Link 
            href="/add" 
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </Link>
          
          <button
            onClick={toggleSelectMode}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 1.5H5.625c-.621 0-1.125.504-1.125 1.125v13.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a.75.75 0 00-1.5 0v3.75a.375.375 0 01-.375.375H5.625a.375.375 0 01-.375-.375v-13.5A.375.375 0 015.625 1.5h3.75a.75.75 0 000-1.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 17.25h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5z" />
            </svg>
            Select
          </button>
          
          <label className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center cursor-pointer text-sm">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
              disabled={isImporting}
            />
            {isImporting ? (
              <>
                <svg className="animate-spin -ml-0.5 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Import...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Import
              </>
            )}
          </label>
          
          {importResult && importResult.success && (
            <div className="text-sm text-green-600 flex items-center">
              ✓ {importResult.count}
            </div>
          )}
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-0.5 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Export...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Enhanced divider with LED effect */}
      <div className="relative h-1 w-full bg-blue-800 mb-6 rounded-full overflow-hidden">
        <div 
          className="absolute h-full w-6 bg-white rounded-full opacity-70 blur-[2px]"
          style={{ 
            left: `${ledPosition}%`,
            transition: 'left 30ms linear',
            boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.8)'
          }}
        />
      </div>
    </div>
  );
}
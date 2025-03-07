"use client";

import { useState } from 'react';
import ToolsToolbar from './ToolsToolbar';
import ToolsList from './ToolsList';

// Import CSS animations
import '@/styles/animations.css';
import { useAuth } from '@/components/AuthProvider';

export default function HomeContent() {
  const [viewMode] = useState<'flat' | 'byCategory'>('flat'); // Match ToolsList terminology
  useAuth();
  
  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto mb-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-center" style={{ color: '#0960DA' }}>
              AI Tools Directory
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
              Discover and share the best AI tools for your workflow.
            </p>
            
            {/* Remove the duplicate view toggle buttons */}
            <div className="flex flex-col md:flex-row items-center justify-end space-y-4 md:space-y-0">
              {/* Tools Toolbar - right aligned on desktop */}
              <ToolsToolbar />
            </div>
          </div>
        </div>
        {/* Pass the viewMode directly to ToolsList */}
        <ToolsList viewMode={viewMode} />
      </div>
    </div>
  );
}
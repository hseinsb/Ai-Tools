"use client";
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Tool, getToolById } from '@/lib/tools-service-firebase';
import Link from 'next/link';

interface ToolPageClientProps {
  initialTool?: Tool | null;
}

export default function ToolPageClient({ initialTool }: ToolPageClientProps) {
  const { id } = useParams();
  const [tool, setTool] = useState<Tool | null>(initialTool || null);
  const [loading, setLoading] = useState(!initialTool);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we don't have initial data, fetch it client-side
    if (!initialTool && id) {
      const fetchTool = async () => {
        try {
          setLoading(true);
          const data = await getToolById(id as string);
          setTool(data);
        } catch (err) {
          console.error('Error fetching tool:', err);
          setError('Failed to load tool details');
        } finally {
          setLoading(false);
        }
      };

      fetchTool();
    }
  }, [id, initialTool]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;
  }

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Tool not found</h1>
        <p>The tool you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{tool.name}</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded">
            {tool.category}
          </span>
        </div>
        <p className="text-gray-700 mb-6">{tool.description}</p>
        
        {tool.link && (
          <div className="mt-6">
            <a 
              href={tool.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Visit Website
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to all tools
        </Link>
      </div>
    </div>
  );
} 
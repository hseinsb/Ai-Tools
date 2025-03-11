"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getToolById, updateTool } from '@/lib/tools-service-firebase';

export default function EditToolPage() {
  const { id } = useParams();
  const toolId = Array.isArray(id) ? id[0] : id;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  
  const categories = [
    "AI Chat", "Image Generation", "Text Generation", 
    "Voice Generation", "Music Generation", "Video Generation",
    "Data Analysis", "Productivity", "Other"
  ];
  
  useEffect(() => {
    async function loadTool() {
      try {
        if (!user) {
          return; // Will redirect in the next useEffect if not logged in
        }
        setIsLoading(true);
        const tool = await getToolById(toolId as string);
        
        if (!tool) {
          setError('Tool not found');
          return;
        }
        
        // No permission check here
        // Always allow editing for authenticated users
        
        // Set form values
        setName(tool.name || '');
        setDescription(tool.description || '');
        setCategory(tool.category || '');
        setLink(tool.link || '');
        
      } catch (err) {
        console.error('Error loading tool:', err);
        setError('Failed to load tool details');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTool();
  }, [toolId, user]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      router.push(`/login?callbackUrl=/edit/${toolId}`);
    }
  }, [user, isLoading, router, toolId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name || !description || !category) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to update a tool');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      // Update the tool with current user as owner if createdBy is missing
      const updatedToolData = {
        name,
        description,
        category,
        link: link || undefined,
        // Add these fields if they might be missing from imported tools
        userId: user.uid,
        createdBy: user.uid,
        updatedAt: new Date().toISOString()
      };
      
      await updateTool(toolId as string, updatedToolData, user.uid);
      
      router.push(`/tool/${toolId}`);
      
    } catch (err: any) {
      console.error('Error updating tool:', err);
      setError(err.message || 'An error occurred while updating the tool');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit AI Tool</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Tool Name*
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="category" className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Category*
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Description*
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          ></textarea>
        </div>
        
        <div className="mb-6">
          <label htmlFor="link" className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Link (optional)
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 
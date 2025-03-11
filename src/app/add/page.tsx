"use client";

import { useState, useEffect, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createTool } from '@/lib/tools-service-firebase';
import Link from 'next/link';
import '@/styles/animations.css';

export default function AddToolPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [, setFocusedField] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState('');
  
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const categories = [
    { id: 'ai-chat', name: 'AI Chat', icon: '💬' },
    { id: 'image-gen', name: 'Image Generation', icon: '🖼️' },
    { id: 'text-gen', name: 'Text Generation', icon: '📝' },
    { id: 'video-gen', name: 'Video Generation', icon: '🎬' },
    { id: 'audio-gen', name: 'Audio Generation', icon: '🔊' },
    { id: 'code', name: 'Code Assistance', icon: '💻' },
    { id: 'productivity', name: 'Productivity', icon: '⚡' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'research', name: 'Research', icon: '🔍' },
    { id: 'other', name: 'Other', icon: '🧩' }
  ];
  
  // Update character count when description changes
  useEffect(() => {
    setCharCount(description.length);
  }, [description]);
  
  // Handle category selection
  const handleCategorySelect = (categoryName: SetStateAction<string>) => {
    setCategory(categoryName);
    // If the selected category is not "Other", clear the custom category
    if (categoryName !== 'Other') {
      setCustomCategory('');
    }
  };
  
  async function handleSubmit(e: { preventDefault: () => void; }) {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setDebugInfo('');
    
    // Determine the final category value
    const finalCategory = category === 'Other' ? customCategory : category;
    
    // Form validation
    if (!name.trim() || !description.trim() || !finalCategory || !link.trim()) {
      setError('Please fill in all fields');
      // Animate the error message
      const errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.classList.add('animate-shake');
        setTimeout(() => {
          errorElement.classList.remove('animate-shake');
        }, 500);
      }
      
      // Special validation for "Other" category
      if (category === 'Other' && !customCategory.trim()) {
        setError('Please specify a custom category');
      }
      
      return;
    }
    
    if (!user) {
      setError('You must be logged in to add a tool');
      setDebugInfo('Auth error: No user found');
      return;
    }
    
    // Get user ID
    const userId = user.uid;
    setDebugInfo(`User ID: ${userId}`);
    
    try {
      setIsLoading(true);
      
      // Prepare tool data
      const toolData = {
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        link: link.trim(),
        userId
      };
      
      setDebugInfo(prev => `${prev}\nPrepared tool data: ${JSON.stringify(toolData)}`);
      
      // Create the tool in Firestore
      await createTool({
        ...toolData,
        id: crypto.randomUUID(), // Generate a unique ID
        createdBy: user.displayName || 'Anonymous' // Add the createdBy field
      });
      
      // Show success message and reset form
      setSuccess(true);
      setName('');
      setDescription('');
      setCategory('');
      setCustomCategory('');
      setLink('');
      
      // Don't redirect immediately - let the user see the success message
    } catch (error) {
      console.error('Error adding tool:', error);
      setError(`Failed to add tool: ${error instanceof Error ? error.message : String(error)}`);
      setDebugInfo(prev => `${prev}\nError: ${JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl fade-in">
      <h1 className="text-3xl font-bold mb-2 slide-in-bottom text-gradient">Add a New AI Tool</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 slide-in-bottom delay-100">
        Share your favorite AI tool with the community.
      </p>
      
      {error && (
        <div id="error-message" className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded relative mb-4 fade-in">
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg 
              className="fill-current h-6 w-6 text-red-500" 
              role="button" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20"
              onClick={() => setError('')}
            >
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}
      
      {/* Show information message for authenticated users */}
      {!loading && !user && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 px-4 py-3 rounded relative mb-4 slide-in-bottom">
          <span className="block mb-2">Please log in to add a tool</span>
          <Link 
            href="/login" 
            className="btn-primary btn-hover-effect"
          >
            Log in
          </Link>
        </div>
      )}
      
      {/* Show success message */}
      {success ? (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded relative mb-4 slide-in-bottom pulse-gentle">
          <p className="font-bold">Success!</p>
          <p className="mb-4">Your tool has been added successfully.</p>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setSuccess(false);
                router.push('/profile');
              }}
              className="btn-primary btn-hover-effect"
            >
              Go to Profile
            </button>
            <button
              onClick={() => {
                setSuccess(false);
              }}
              className="btn-secondary btn-hover-effect"
            >
              Add Another Tool
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-hover rounded-lg p-6 border border-gray-200 dark:border-gray-700 slide-in-bottom delay-200">
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 label-hover" htmlFor="name">
              Tool Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. ChatGPT"
              className="input-hover-effect shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none"
              required
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 label-hover" htmlFor="category">
              Category *
            </label>
            
            {/* Styled category buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {categories.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.name)}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory('')}
                  className={`category-card ${category === cat.name ? 'category-selected' : ''} ${hoveredCategory === cat.id ? 'category-hover' : ''}`}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
            
            {/* Custom category input - only visible when "Other" is selected */}
            {category === 'Other' && (
              <div className="slide-in-bottom mt-3">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 label-hover" htmlFor="customCategory">
                  Specify Category *
                </label>
                <input
                  type="text"
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onFocus={() => setFocusedField('customCategory')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g. 3D Generation"
                  className="input-hover-effect shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none"
                  required={category === 'Other'}
                />
              </div>
            )}
            
            {/* Fallback select for accessibility */}
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => handleCategorySelect(e.target.value)}
                onFocus={() => setFocusedField('category')}
                onBlur={() => setFocusedField(null)}
                className="sr-only"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 label-hover" htmlFor="link">
              Website URL *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
              </div>
              <input
                type="url"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onFocus={() => setFocusedField('link')}
                onBlur={() => setFocusedField(null)}
                placeholder="https://example.com"
                className="input-hover-effect pl-10 shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 label-hover" htmlFor="description">
              Description *
            </label>
            <div className="relative">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                placeholder="Describe what this AI tool does..."
                rows={4}
                className="input-hover-effect shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none"
                required
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                {charCount} characters
              </div>
            </div>
            
            {/* Character count progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full character-count-bar" 
                style={{width: `${Math.min(100, (charCount / 10))}%`}}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !user}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Adding...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Tool
                </>
              )}
            </button>
          </div>
        </form>
      )}
      
      {/* Debug information in development */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg slide-in-bottom delay-300 hover-slide">
          <h3 className="font-mono text-sm mb-2">Debug Info:</h3>
          <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300">
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  );
} 
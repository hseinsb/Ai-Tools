'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { createTool } from '@/lib/tools-service-firebase';
import { Tool } from '../../types';

const CATEGORIES = [
  'Audio & Music',
  'Content Generation',
  'Conversation',
  'Education & Learning',
  'Image Generation',
  'Image Editing',
  'Productivity',
  'Research',
  'Video Generation',
  'Video Editing',
  'Other'
];

interface FormData {
  name: string;
  category: string;
  description: string;
  link: string;
}

export default function AddToolForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    description: '',
    link: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(!user);
  
  // Update form data on input change
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Handle not logged in case
      alert('You must be logged in to add a tool');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add userId to the tool data
      const toolData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        link: formData.link,
        userId: user.uid // Include user ID
      };
      
      await createTool(toolData as unknown as Tool);
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        description: '',
        link: ''
      });
      
      setError(null);
      postMessage({ type: 'success', text: 'Tool added successfully!' });
      setTimeout(() => postMessage(null), 5000);
    } catch (error) {
      console.error('Error adding tool:', error);
      setError('Failed to add tool. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render login prompt if user is not logged in
  if (showLoginPrompt) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          You need to be logged in to add a new tool to the library.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => router.push('/login')}
            className="btn btn-primary"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/register')}
            className="btn btn-outline"
          >
            Register
          </button>
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="btn btn-outline text-gray-500"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Add a New AI Tool</h2>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label htmlFor="name" className="form-label">
            Tool Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. ChatGPT"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-control">
          <label htmlFor="category" className="form-label">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
            required
            disabled={isSubmitting}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-control">
          <label htmlFor="description" className="form-label">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            rows={4}
            placeholder="Describe what this tool does and why it's useful..."
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-control">
          <label htmlFor="link" className="form-label">
            Website Link
          </label>
          <input
            type="url"
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            className="form-input"
            placeholder="https://example.com"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn btn-outline"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary relative"
            disabled={isSubmitting}
          >
            <span className={isSubmitting ? 'opacity-0' : 'opacity-100'}>
              Add Tool
            </span>
            {isSubmitting && (
              <span className="absolute inset-0 flex items-center justify-center">
                <div className="spinner"></div>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 
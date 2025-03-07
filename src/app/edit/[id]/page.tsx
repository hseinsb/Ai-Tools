"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

// Define the Tool interface
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  link: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  pricing?: string;
  tags?: string;
}

export default function EditToolPage() {
  const [setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    link: '',
    pricing: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  // Categories from your AddToolForm component
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

  useEffect(() => {
    const loadTool = async () => {
      try {
        if (!user) {
          router.push('/login');
          return;
        }
        
        const toolId = params.id as string;
        if (!toolId) {
          setError('Tool ID is missing');
          setIsLoading(false);
          return;
        }
        
        // Get the tool document from Firestore
        const toolRef = doc(db, `users/${user.uid}/tools`, toolId);
        const toolSnap = await getDoc(toolRef);
        
        if (!toolSnap.exists()) {
          setError('Tool not found');
          setIsLoading(false);
          return;
        }
        
        const toolData = { id: toolSnap.id, ...toolSnap.data() } as Tool;
        setTool(toolData as never);
        // Set form data
        setFormData({
          name: toolData.name || '',
          category: toolData.category || '',
          description: toolData.description || '',
          link: toolData.link || '',
          pricing: toolData.pricing || '',
          tags: toolData.tags || ''
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading tool:', err);
        setError('Failed to load tool data');
        setIsLoading(false);
      }
    };
    
    loadTool();
  }, [user, params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const toolId = params.id as string;
      const toolRef = doc(db, `users/${user.uid}/tools`, toolId);
      
      // Update the tool in Firestore
      await updateDoc(toolRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      // Redirect to home page after successful update
      router.push('/');
    } catch (err) {
      console.error('Error updating tool:', err);
      setError('Failed to update tool');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Tool</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="form-control mb-4">
          <label htmlFor="name" className="form-label block mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input w-full p-2 border rounded"
            placeholder="e.g. ChatGPT"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-control mb-4">
          <label htmlFor="category" className="form-label block mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select w-full p-2 border rounded"
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
        
        <div className="form-control mb-4">
          <label htmlFor="description" className="form-label block mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea w-full p-2 border rounded"
            rows={4}
            placeholder="Describe what this tool does..."
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-control mb-4">
          <label htmlFor="link" className="form-label block mb-2">
            Link
          </label>
          <input
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            className="form-input w-full p-2 border rounded"
            placeholder="https://example.com"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-control mb-4">
          <label htmlFor="pricing" className="form-label block mb-2">
            Pricing
          </label>
          <input
            id="pricing"
            name="pricing"
            value={formData.pricing}
            onChange={handleChange}
            className="form-input w-full p-2 border rounded"
            placeholder="Free, Freemium, Paid, etc."
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-control mb-6">
          <label htmlFor="tags" className="form-label block mb-2">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="form-input w-full p-2 border rounded"
            placeholder="Comma separated tags"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Link
            href="/"
            className="btn btn-outline px-4 py-2 border rounded"
            onClick={(e) => {
              if (isSubmitting) e.preventDefault();
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary px-4 py-2 bg-blue-600 text-white rounded relative"
            disabled={isSubmitting}
          >
            <span className={isSubmitting ? 'opacity-0' : 'opacity-100'}>
              Save Changes
            </span>
            {isSubmitting && (
              <span className="absolute inset-0 flex items-center justify-center">
                <div className="spinner h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 
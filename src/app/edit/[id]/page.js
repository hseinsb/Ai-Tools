"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function EditToolPage() {
  const [tool, setTool] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category: 'General',
    tags: '',
    pricing: '',
    logoUrl: '',
    freeLabel: false,
    freemiumLabel: false,
    paidLabel: false,
    favorite: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const categories = [
    'General',
    'Chat',
    'Image Generation',
    'Video Generation',
    'Audio Generation',
    'Text Processing',
    'Data Analysis',
    'Development',
    'Education',
    'Productivity',
    'Other'
  ];
  
  // Load tool data
  useEffect(() => {
    async function loadTool() {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const id = params.id;
        const toolRef = doc(db, 'tools', id);
        const toolSnap = await getDoc(toolRef);
        
        if (!toolSnap.exists()) {
          setError('Tool not found');
          setLoading(false);
          return;
        }
        
        const toolData = { id: toolSnap.id, ...toolSnap.data() };
        setTool(toolData);
        // Set form data
        setFormData({
          name: toolData.name || '',
          description: toolData.description || '',
          url: toolData.url || '',
          category: toolData.category || 'General',
          tags: toolData.tags || '',
          pricing: toolData.pricing || '',
          logoUrl: toolData.logoUrl || '',
          freeLabel: toolData.freeLabel || false,
          freemiumLabel: toolData.freemiumLabel || false,
          paidLabel: toolData.paidLabel || false,
          favorite: toolData.favorite || false
        });
      } catch (err) {
        console.error('Error loading tool:', err);
        setError('Failed to load tool data');
      } finally {
        setLoading(false);
      }
    }
    
    loadTool();
  }, [user, router, params.id]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Update the tool in Firestore
      const toolRef = doc(db, 'tools', params.id);
      await updateDoc(toolRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      setSuccess(true);
      
      // Redirect to the tool page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Error updating tool:', err);
      setError('Failed to update tool');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error && !tool) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-10">
        <h1 className="text-2xl font-bold text-center mb-6 text-red-500">{error}</h1>
        <div className="text-center">
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">Edit Tool</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Tool updated successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="url" className="block text-gray-700 dark:text-gray-300 mb-2">
            URL *
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="category" className="block text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
            required
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="tags" className="block text-gray-700 dark:text-gray-300 mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="pricing" className="block text-gray-700 dark:text-gray-300 mb-2">
            Pricing Details
          </label>
          <input
            type="text"
            id="pricing"
            name="pricing"
            value={formData.pricing}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="logoUrl" className="block text-gray-700 dark:text-gray-300 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            id="logoUrl"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
          />
        </div>
        
        <div className="mb-6">
          <p className="block text-gray-700 dark:text-gray-300 mb-2">Pricing Labels</p>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="freeLabel"
                checked={formData.freeLabel}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Free</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="freemiumLabel"
                checked={formData.freemiumLabel}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Freemium</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="paidLabel"
                checked={formData.paidLabel}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Paid</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="favorite"
                checked={formData.favorite}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-yellow-400"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Favorite</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 relative"
          >
            {saving ? (
              <span className="invisible">Update Tool</span>
            ) : (
              "Update Tool"
            )}
            
            {saving && (
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
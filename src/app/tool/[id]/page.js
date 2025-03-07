// Server Component (no 'use client' directive)
import ToolPageClient from '@/app/tool/[id]/ToolPageClient';
import { getToolById } from '@/lib/tools-service-firebase';

// This runs at build time
export async function generateStaticParams() {
  // For now just generate a few static params
  // In production, you might want to generate these from your database
  return [{ id: 'mock-1' }, { id: 'mock-2' }]; 
}

// Convert to JavaScript to avoid TypeScript errors
export default async function ToolPage({ params }) {
  const id = params.id;
  
  // You can fetch the tool data server-side if needed
  // or just pass the ID to the client component
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ToolDetail id={id} />
    </div>
  );
}

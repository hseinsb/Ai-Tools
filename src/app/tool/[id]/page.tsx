// Server Component (no 'use client' directive)
import ToolPageClient from '@/app/tool/[id]/ToolPageClient';
import { getToolById } from '@/lib/tools-service-firebase';

// This runs at build time
export async function generateStaticParams() {
  // For now just generate a few static params
  // In production, you might want to generate these from your database
  return [{ id: 'mock-1' }, { id: 'mock-2' }]; 
}

// This is the server component
export default async function ToolPage({ params }: { params: { id: string } }) {
  // Pre-fetch the tool data (will be cached by Next.js)
  // This enables both static generation and server-side rendering
  const toolData = await getToolById(params.id);
  
  // Pass the prefetched data to the client component
  return <ToolPageClient initialTool={toolData} />;
}

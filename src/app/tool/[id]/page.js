/* eslint-disable react/jsx-no-undef */
/* eslint-disable react/jsx-no-comment-textnodes */
// Server Component (no 'use client' directive)


// This runs at build time
export async function generateStaticParams() {
  // For now just generate a few static params
  // In production, you might want to generate these from your database
  return [{ id: 'mock-1' }, { id: 'mock-2' }]; 
}

// Convert to JavaScript to avoid TypeScript errors
export default function ToolPage({ params }) {
  const id = params.id;
  
  // You can fetch the tool data server-side if needed
  // or just pass the ID to the client component
  
  return (
    <div className="container mx-auto px-4 py-8">
      // eslint-disable-next-line react/jsx-no-undef, react/jsx-no-undef
      <ToolDetail id={id} />
    </div>
  );
}

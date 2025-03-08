/** @type {import('next').NextConfig} */
const nextConfig = {
  // Completely disable TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Use React strict mode
  reactStrictMode: true,
  
  // Only process JS and JSX during build
  pageExtensions: ['js', 'jsx'],
  
  // Additional settings
  poweredByHeader: false
};

module.exports = nextConfig; 
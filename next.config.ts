/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['undici', 'firebase'],
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Skip type checking during build
  skipTypeCheck: true,
  // Skip middleware
  skipMiddlewareUrlNormalize: true,
  // Disable strict mode for API routes
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['mongoose', 'csv-stringify', 'next-auth'],
  },
  webpack: (config) => {
    // Add specific rule for undici
    config.module.rules.push({
      test: /node_modules\/undici\/lib\/web\/fetch\/util\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            ['@babel/plugin-proposal-private-methods', { loose: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
          ]
        }
      }
    });
    
    // Ignore problematic modules
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        'csv-stringify/sync': false,
        'next-auth/next': false,
        'mongoose': false,
      },
    };
    
    return config;
  }
}

module.exports = nextConfig;
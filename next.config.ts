/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['undici', 'firebase'],
  webpack: (config: { module: { rules: { test: RegExp; use: { loader: string; options: { presets: string[]; plugins: (string | { loose: boolean; })[][]; }; }; }[]; }; }) => {
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
    
    return config;
  }
}

module.exports = nextConfig;
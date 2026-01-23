/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable optimized client-side navigation and prefetching
  experimental: {
    // Optimize CSS loading for faster page transitions
    optimizeCss: true,
    // Enable scroll restoration for better navigation UX
    scrollRestoration: true,
  },

  // Optimize images for faster loading
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable React strict mode for better development
  reactStrictMode: true,

  // Optimize builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable optimized client-side navigation and prefetching
  experimental: {
    // scrollRestoration only — optimizeCss needs optional `critters` dep
    // Do NOT add @solar-icons/react to optimizePackageImports: icons live under
    // category subpaths (e.g. csr/search/Magnifer), so Next's rewrite breaks.
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

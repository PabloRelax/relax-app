// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Don’t fail the production build on ESLint errors (temporary)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don’t fail the production build on TS errors (temporary)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

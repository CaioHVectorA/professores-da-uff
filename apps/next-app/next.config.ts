import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true
  },
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;

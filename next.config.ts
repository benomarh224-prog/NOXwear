import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    deviceSizes: [320, 640, 960, 1280, 1800],
    imageSizes: [96],
  },
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;

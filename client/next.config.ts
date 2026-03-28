import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Makes image delivery work consistently when deploying without Next's image optimizer setup.
    unoptimized: true,
  },
};

export default nextConfig;

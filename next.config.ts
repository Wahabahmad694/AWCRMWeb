import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    serverActions: { bodySizeLimit: "3mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;

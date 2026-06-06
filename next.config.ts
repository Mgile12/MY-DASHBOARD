import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Run middleware on Node.js runtime instead of Edge.
    // NextAuth v5's jose / @auth/core deps reference __dirname which
    // the Edge runtime doesn't provide, causing a 500 at request time.
    // Node middleware fixes that. ~10ms extra cold start — fine here.
    // Cast because Next's types lag the experimental feature flag.
    nodeMiddleware: true,
  } as NextConfig["experimental"] & { nodeMiddleware?: boolean },
};

export default nextConfig;

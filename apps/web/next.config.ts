import type { NextConfig } from "next";

/**
 * SSR/ISR mode (no `output: 'export'`) — the app runs via `next start` behind
 * nginx. `transpilePackages` lets Next compile the workspace `shared` package
 * directly from its TypeScript source.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@yours-truly/shared"],
};

export default nextConfig;

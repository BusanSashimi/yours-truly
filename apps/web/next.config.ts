import type { NextConfig } from "next";

/**
 * SSR/ISR mode (no `output: 'export'`) — the app runs via `next start` behind
 * nginx. `transpilePackages` lets Next compile the workspace `shared` package
 * directly from its TypeScript source.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@yours-truly/shared"],
  // Browser code always talks same-origin `/api`. In production nginx routes
  // /api/* to the API before Next ever sees it; in dev this rewrite plays the
  // nginx role, so cookies/auth behave identically in both environments.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:4000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

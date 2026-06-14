import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * SSR/ISR mode (no `output: 'export'`) — the app runs via `next start` behind
 * nginx. `transpilePackages` lets Next compile the workspace `shared` package
 * directly from its TypeScript source.
 */
// Keep in sync with ASSET_HOST in src/lib/assets.ts.
const assetHost =
  process.env.NEXT_PUBLIC_ASSET_HOST ??
  (process.env.NODE_ENV === "development"
    ? "yourstruly-assets-dev.s3.us-east-1.amazonaws.com"
    : "yourstruly-assets.s3.us-east-1.amazonaws.com");

const nextConfig: NextConfig = {
  transpilePackages: ["@yours-truly/shared"],
  images: {
    // Exact host + prefix only — the optimizer must never become a proxy for
    // arbitrary origins. No wildcards; query strings rejected.
    remotePatterns: [
      // Couple's own assets (i/) and guest-uploaded media (g/) — exact host +
      // prefixes only; the optimizer must never proxy arbitrary origins.
      { protocol: "https", hostname: assetHost, port: "", pathname: "/i/**", search: "" },
      { protocol: "https", hostname: assetHost, port: "", pathname: "/g/**", search: "" },
    ],
    // Bound the (url, w, q) tuple space a client can make sharp chew through.
    qualities: [60, 75],
    // Asset keys are immutable uuids — cache optimized variants for a year.
    minimumCacheTTL: 31536000,
  },
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

export default withNextIntl(nextConfig);

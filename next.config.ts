import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/guide/ai-bot-teams",
        destination: "/guide/ai-agent-teams",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress noisy Sentry build logs
  silent: true,

  // Upload source maps for readable stack traces
  widenClientFileUpload: true,

  // Hide source maps from users
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel Sentry events through the app to avoid ad blockers
  tunnelRoute: "/monitoring",
});

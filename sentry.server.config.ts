import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Don't send events in development
  enabled: process.env.NODE_ENV === "production",

  // Prevent OTel module duplication with Next.js 16 + Turbopack
  // that causes intermittent "No response is returned" 500s on cold starts
  skipOpenTelemetrySetup: true,
});

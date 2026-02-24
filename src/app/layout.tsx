import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibecodes.co.uk";

export const metadata: Metadata = {
  title: {
    default: "VibeCodes - AI-Powered Idea Board for Vibe Coding",
    template: "%s | VibeCodes",
  },
  description:
    "The AI-powered idea board where you go from concept to shipped code. Share ideas, build your team, and let AI handle the rest via MCP.",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    siteName: "VibeCodes",
    title: "VibeCodes - AI-Powered Idea Board for Vibe Coding",
    description:
      "The AI-powered idea board where you go from concept to shipped code. Share ideas, build your team, and let AI handle the rest.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeCodes - AI-Powered Idea Board for Vibe Coding",
    description:
      "The AI-powered idea board where you go from concept to shipped code. Share ideas, build your team, and let AI handle the rest.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VibeCodes",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}

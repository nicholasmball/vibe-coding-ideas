import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VibeCodes - AI-Powered Idea Board for Vibe Coding";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "15%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "15%",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Sparkles icon (simplified SVG path) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M16 4l1.5 5.5L23 11l-5.5 1.5L16 18l-1.5-5.5L9 11l5.5-1.5L16 4z"
              fill="white"
            />
            <path
              d="M24 16l1 3.5 3.5 1-3.5 1-1 3.5-1-3.5L19.5 20.5l3.5-1L24 16z"
              fill="white"
              opacity="0.7"
            />
            <path
              d="M10 18l0.75 2.5L13.25 21.25l-2.5 0.75L10 24.5l-0.75-2.5L6.75 21.25l2.5-0.75L10 18z"
              fill="white"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: "16px",
          }}
        >
          VibeCodes
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          Where vibe coding ideas come to life
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "32px",
            padding: "8px 20px",
            borderRadius: "9999px",
            border: "1px solid rgba(139,92,246,0.4)",
            background: "rgba(139,92,246,0.1)",
          }}
        >
          <div style={{ fontSize: "16px", color: "#a78bfa" }}>
            Idea to shipped code, powered by AI
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

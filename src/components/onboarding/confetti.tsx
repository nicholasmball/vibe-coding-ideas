"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#8b5cf6",
  "#a78bfa",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#0ea5e9",
  "#c4b5fd",
  "#34d399",
];

export function Confetti() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const count = 50;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = 4 + Math.random() * 5;
      const left = Math.random() * 100;
      const delay = Math.random() * 0.4;
      const duration = 1.5 + Math.random() * 2;
      const isCircle = Math.random() > 0.5;

      Object.assign(particle.style, {
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        top: `${-10 + Math.random() * 20}%`,
        background: color,
        borderRadius: isCircle ? "50%" : "1px",
        opacity: "0",
        animation: `confettiFall ${duration}s ease-out ${delay}s forwards`,
      });

      container.appendChild(particle);
      particles.push(particle);
    }

    const timeout = setTimeout(() => {
      particles.forEach((p) => p.remove());
    }, 4000);

    return () => {
      clearTimeout(timeout);
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(-20px) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(400px) rotate(720deg) scale(0.5);
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      />
    </>
  );
}

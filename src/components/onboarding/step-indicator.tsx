"use client";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-5">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-400",
            i === currentStep
              ? "w-6 bg-primary"
              : i < currentStep
                ? "w-1.5 bg-primary/50"
                : "w-1.5 bg-muted-foreground/30"
          )}
          style={{
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      ))}
    </div>
  );
}

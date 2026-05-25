"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export default function StepIndicator({
  steps,
  currentStep,
  className,
  orientation = "horizontal",
}: StepIndicatorProps) {
  const isVertical = orientation === "vertical";

  return (
    <div className={cn(isVertical ? "flex flex-col gap-0" : "relative", className)}>
      {/* Horizontal Progress Lines (Absolute) */}
      {!isVertical && (
        <>
          {/* Background Line */}
          <div className="absolute top-[17px] left-0 w-full h-0.5 bg-surface-200 z-0" />
          {/* Active Line (Animated) */}
          <div
            className="absolute top-[17px] left-0 h-0.5 bg-primary-700 z-0 transition-all duration-500"
            style={{ width: `${(currentStep / (Math.max(1, steps.length - 1))) * 100}%` }}
          />
        </>
      )}

      <div className={cn(!isVertical && "flex justify-between relative z-10")}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={index}
              className={cn(
                isVertical ? "flex gap-3 relative" : "flex flex-col items-center text-center w-32"
              )}
            >
              {/* Vertical Progress Line (Absolute inside each step) */}
              {isVertical && !isLast && (
                <div className="absolute left-[17px] top-9 bottom-[-12px] w-0.5 bg-surface-200 z-0">
                  <div
                    className={cn(
                      "w-full bg-primary-700 transition-all duration-500",
                      isCompleted ? "h-full" : "h-0"
                    )}
                  />
                </div>
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center relative z-10",
                  "text-sm font-semibold transition-all duration-300",
                  "border-2",
                  isCompleted
                    ? "bg-primary-700 border-primary-700 text-white"
                    : isCurrent
                    ? "bg-white border-primary-700 text-primary-700 shadow-sm ring-4 ring-primary-100"
                    : "bg-surface-50 border-surface-300 text-surface-400"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : index + 1}
              </div>

              {/* Label */}
              <div className={cn(isVertical ? "pt-1 pb-8 min-w-0" : "mt-3 px-1")}>
                <p
                  className={cn(
                    "text-xs sm:text-sm font-medium leading-tight",
                    isCurrent
                      ? "text-primary-700"
                      : isCompleted
                      ? "text-surface-700"
                      : "text-surface-400"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[11px] text-surface-400 mt-1 hidden sm:block leading-tight">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

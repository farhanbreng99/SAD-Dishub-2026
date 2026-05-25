"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";
import { formatStatus, getStatusColor } from "@/lib/utils";

// ─── Generic Badge ─────────────────────────────────

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-surface-100 text-surface-600",
  primary: "bg-primary-50 text-primary-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
};

const dotVariants: Record<BadgeVariant, string> = {
  default: "bg-surface-400",
  primary: "bg-primary-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap",
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotVariants[variant])} />
      )}
      {children}
    </span>
  );
}

// ─── Status Badge (Specialized) ────────────────────

interface StatusBadgeProps {
  status: ApplicationStatus | "locked";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const label = status === "locked" ? "Terkunci" : formatStatus(status as ApplicationStatus);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap",
        colors.bg,
        colors.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", colors.dot)} />
      {label}
    </span>
  );
}

// ─── Rule Badge ────────────────────────────────────

interface RuleBadgeProps {
  passed: boolean | null;
  label: string;
  className?: string;
}

export function RuleBadge({ passed, label, className }: RuleBadgeProps) {
  const variant = passed === null ? "default" : passed ? "success" : "danger";

  return (
    <Badge variant={variant} dot size="sm" className={className}>
      {label}: {passed === null ? "Pending" : passed ? "Lolos" : "Gagal"}
    </Badge>
  );
}

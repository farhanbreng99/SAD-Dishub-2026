"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Clock,
  Bell,
  User,
} from "lucide-react";

// ─── Applicant Bottom Nav Items ────────────────────

const navItems = [
  {
    label: "Beranda",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Ajukan",
    href: "/apply",
    icon: FileText,
  },
  {
    label: "Status",
    href: "/status",
    icon: Clock,
  },
  {
    label: "Profil",
    href: "/profile",
    icon: User,
  },
];

interface BottomNavProps {
  className?: string;
}

export default function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 sm:h-20 lg:hidden" />

      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 lg:hidden",
          "bg-white/95 backdrop-blur-md border-t border-surface-200",
          "safe-area-bottom",
          className
        )}
      >
        <div className="flex items-center justify-around h-16 sm:h-20 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full py-1.5",
                  "transition-all duration-200 rounded-lg",
                  isActive
                    ? "text-primary-700"
                    : "text-surface-400 hover:text-surface-600 active:text-surface-700"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-700" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium leading-tight",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

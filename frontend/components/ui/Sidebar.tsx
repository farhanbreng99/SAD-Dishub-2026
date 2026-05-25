"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { logout, getCachedUser, getRole } from "@/lib/auth";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Download,
  LogOut,
  ChevronLeft,
  Menu,
  Building2,
} from "lucide-react";
import type { UserRole } from "@/types";

// ─── Navigation Items by Role ──────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Pengajuan", href: "/admin/applications", icon: <FileText className="w-5 h-5" /> },
  { label: "Kuota Divisi", href: "/admin/quotas", icon: <Building2 className="w-5 h-5" /> },
];

const headNavItems: NavItem[] = [
  { label: "Dashboard", href: "/head/dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Ekspor Data", href: "/head/export", icon: <Download className="w-5 h-5" /> },
];

function getNavItems(role?: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return adminNavItems;
    case "head":
      return headNavItems;
    default:
      return [];
  }
}

// ─── Sidebar Component ─────────────────────────────

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setUser(getCachedUser());
    setRole(getRole());
    setMounted(true);
  }, []);

  const navItems = getNavItems(role);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200 shrink-0">
        <div className="flex items-center shrink-0">
          <img 
            alt="Logo Dishub Surabaya" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaTQGre1sH5C4WcwF8xJY000hAkbjBVO-WicCWICUAmc6TbSWRxWe_7QSxo8eA2mb0jVjZZXXX9aary7QztfmGSakJpRUrVFu32Mib_nHK-dr0NcUH_Ir6vXSbTafbOlDl35XHp2854LbHd7aVX1H5mGJN5VOV3SSQjxBYq7WTwxIYdot0irn6TdSz8P-JiifIETMa7Iu2YdvoKGkbiQSDev4-3UdPfK0QAtqunArnIR9hFeXYohSafUBn9pyuF35wnAllUI6Y69k" 
            className="h-9 w-auto object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-surface-900 truncate">E-Internship</p>
            <p className="text-[11px] text-surface-400 truncate">Dishub Surabaya</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                isActive
                  ? "bg-primary-50 text-primary-700 border-l-[3px] border-primary-700"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-800"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-surface-200 p-3 space-y-2 shrink-0">
        {user && (
          <div className={cn("flex items-center gap-3 px-2 py-2", collapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary-700">
                {getInitials(user.name)}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{user.name}</p>
                <p className="text-xs text-surface-400 truncate capitalize">{user.role}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium",
            "text-red-600 hover:bg-red-50 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* Collapse Button (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-10 border-t border-surface-200 text-surface-400 hover:text-surface-600 hover:bg-surface-50 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")}
        />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow-card border border-surface-200 text-surface-600"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white border-r border-surface-200",
          "transition-all duration-300 ease-out",
          // Desktop
          "hidden lg:flex lg:flex-col",
          collapsed ? "lg:w-[68px]" : "lg:w-64",
          // Mobile (always full width when open)
          mobileOpen && "!flex w-72",
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Spacer for main content */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      />
    </>
  );
}

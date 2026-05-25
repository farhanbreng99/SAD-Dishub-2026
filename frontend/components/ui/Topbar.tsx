"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials, formatDateTime } from "@/lib/utils";
import { getCachedUser, logout } from "@/lib/auth";
import api from "@/lib/axios";
import type { Notification } from "@/types";
import {
  Bell,
  X,
  ChevronDown,
  Check,
  ChevronLeft,
} from "lucide-react";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function Topbar({ title, subtitle, className, children }: TopbarProps) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getCachedUser());
    setMounted(true);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!mounted) return;
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        const data = res.data.data?.data || res.data.data || [];
        setNotifications(Array.isArray(data) ? data.slice(0, 10) : []);
        setUnreadCount(
          Array.isArray(data) ? data.filter((n: Notification) => !n.is_read).length : 0
        );
      } catch {
        // Silently fail — notifications are non-critical
      }
    };
    fetchNotifications();
  }, [mounted]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8",
        "bg-white/95 backdrop-blur-md border-b border-surface-200",
        className
      )}
    >
      {/* Left: Title & Back Button */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile spacer for hamburger */}
        <div className="w-10 lg:hidden" />
        
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          title="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          {title && (
            <h1 className="text-lg font-semibold text-surface-900 truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-surface-400 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Desktop Navigation (Applicants Only) */}
      {mounted && user?.role === "applicant" && (
        <nav className="hidden lg:flex items-center gap-1 mx-4">
          {[
            { label: "Beranda", href: "/dashboard" },
            { label: "Ajukan", href: "/apply" },
            { label: "Status", href: "/status" },
            { label: "Profil", href: "/profile" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Custom children (filters, etc.) */}
        {children}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {mounted && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifs && mounted && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-modal border border-surface-200 overflow-hidden animate-slide-up z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                <h3 className="text-sm font-semibold text-surface-900">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary-600 font-medium">
                    {unreadCount} belum dibaca
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-surface-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-surface-400">
                    Belum ada notifikasi.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "px-4 py-3 flex gap-3 transition-colors cursor-pointer hover:bg-surface-50",
                        !notif.is_read && "bg-primary-50/30"
                      )}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          notif.is_read ? "bg-transparent" : "bg-primary-500"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-surface-800 truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-surface-400 mt-1">
                          {formatDateTime(notif.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="shrink-0 p-1 rounded hover:bg-surface-200 text-surface-400"
                          title="Tandai dibaca"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        {mounted && user && (
          <div className="flex items-center gap-2 pl-2 border-l border-surface-200 ml-1">
            <div className="hidden sm:flex items-center gap-2.5 mr-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-700">
                  {getInitials(user.name)}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-surface-800 leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-surface-400 capitalize">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/login";
              }}
              className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Keluar (Logout)"
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

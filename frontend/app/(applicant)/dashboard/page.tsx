"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCachedUser } from "@/lib/auth";
import api from "@/lib/axios";
import type { Application, Notification as NotifType } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatDateTime, formatStatus } from "@/lib/utils";
import {
  FileText,
  Clock,
  Bell,
  ArrowRight,
  Sparkles,
  Upload,
  Search,
  CircleDot,
} from "lucide-react";

export default function ApplicantDashboardPage() {
  const user = getCachedUser();
  const [latestApp, setLatestApp] = useState<Application | null>(null);
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, notifsRes] = await Promise.all([
          api.get("/applications/my"),
          api.get("/notifications"),
        ]);
        const apps = appsRes.data.data?.data || appsRes.data.data || [];
        if (Array.isArray(apps) && apps.length > 0) setLatestApp(apps[0]);
        const notifs = notifsRes.data.data?.data || notifsRes.data.data || [];
        setNotifications(Array.isArray(notifs) ? notifs.slice(0, 5) : []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickActions = [
    {
      icon: Upload,
      title: "Ajukan Magang",
      desc: "Pilih divisi dan unggah berkas",
      href: "/apply",
      color: "bg-primary-50 text-primary-600",
    },
    {
      icon: Search,
      title: "Lacak Status",
      desc: "Pantau proses pengajuan",
      href: "/status",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Bell,
      title: "Notifikasi",
      desc: `${notifications.filter((n) => !n.is_read).length || 0} belum dibaca`,
      href: "#notifications",
      color: "bg-amber-50 text-amber-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonCard />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <Card padding="lg" className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 border-0 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary-200" />
            <span className="text-primary-200 text-sm font-medium">Portal Magang</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Halo, {user?.name?.split(" ")[0] || "Pemohon"}! 👋
          </h2>
          <p className="text-primary-100 mt-2 text-sm sm:text-base">
            Selamat datang di E-Internship Dinas Perhubungan Kota Surabaya.
          </p>
          {latestApp && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-primary-200 text-sm">Status pengajuan terakhir:</span>
              <StatusBadge status={latestApp.status} />
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card hover padding="md" className="h-full group">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${action.color} transition-transform group-hover:scale-110`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-900">{action.title}</h3>
                    <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{action.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Notifications */}
      <div id="notifications">
        <Card padding="none">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-base font-semibold text-surface-900">Notifikasi Terbaru</h3>
            <span className="text-xs text-surface-400">{notifications.length} notifikasi</span>
          </div>
          <div className="divide-y divide-surface-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-10 h-10 text-surface-200 mx-auto mb-2" />
                <p className="text-sm text-surface-400">Belum ada notifikasi.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-5 py-3.5 flex gap-3 transition-colors ${!n.is_read ? "bg-primary-50/30" : ""}`}>
                  <div className="mt-1.5 shrink-0">
                    <CircleDot className={`w-3 h-3 ${n.is_read ? "text-surface-300" : "text-primary-500"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-800">{n.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-surface-400 mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

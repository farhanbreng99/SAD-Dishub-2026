"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import type { Application, Division } from "@/types";
import Card from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonStat, SkeletonCard } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { formatApplicantType, formatDate } from "@/lib/utils";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [appsRes, divsRes] = await Promise.all([
        api.get("/admin/applications", { params: { per_page: 10, sort: "-created_at" } }),
        api.get("/admin/divisions"),
      ]);
      const appData = appsRes.data.data?.data || [];
      setApps(Array.isArray(appData) ? appData : []);

      const divisions: Division[] = divsRes.data.data || [];
      const s = { total: 0, pending: 0, accepted: 0, rejected: 0 };
      divisions.forEach((d) => {
        s.total += d.total_count || 0;
        s.pending += (d.pending_count || 0) + (d.reviewing_count || 0);
        s.accepted += d.accepted_count || 0;
        s.rejected += d.rejected_count || 0;
      });
      setStats(s);
    } catch { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Pelamar", value: stats.total, icon: Users, color: "text-primary-600 bg-primary-50" },
    { label: "Menunggu Review", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Diterima", value: stats.accepted, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Ditolak", value: stats.rejected, icon: XCircle, color: "text-red-600 bg-red-50" },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <SkeletonCard />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Dasbor Admin</h1>
          <p className="page-subtitle">Ringkasan data pengajuan magang terkini.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchData} 
          disabled={refreshing}
          icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
        >
          Segarkan Data
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} padding="md">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="stat-value text-xl">{s.value}</p>
                <p className="stat-label text-xs">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Applications Table */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-surface-900">Pengajuan Terbaru</h3>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/applications")}
            icon={<TrendingUp className="w-4 h-4" />}>
            Lihat Semua
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-surface-50 border-y border-surface-200">
                {["No", "Nama", "Institusi", "Jenis", "Divisi", "Skor", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {apps.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-surface-400">Belum ada pengajuan.</td></tr>
              ) : (
                apps.map((a, i) => (
                  <tr key={a.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-surface-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-surface-800">{a.user?.name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{a.user?.institution_name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{formatApplicantType(a.user?.applicant_type)}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{a.division?.name || "-"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-surface-700">{a.algorithm_score ?? "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/applications/${a.id}`)}
                        icon={<Eye className="w-4 h-4" />}>Detail</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

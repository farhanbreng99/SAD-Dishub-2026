"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Analytics } from "@/types";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { SkeletonStat, SkeletonCard } from "@/components/ui/Skeleton";
import BarChartComponent from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import LineChartComponent from "@/components/charts/LineChart";
import { formatApplicantType, getMonthName, cn } from "@/lib/utils";
import {
  Users,
  CheckCircle,
  XCircle,
  Lock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function HeadDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = () => {
    api.get("/head/analytics")
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard /><SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );

  if (!data) return <p className="text-center py-16 text-surface-400">Gagal memuat data analitik.</p>;

  const kpis = [
    { label: "Total Pelamar Aktif", value: data.total_applicants, icon: Users, color: "text-primary-600 bg-primary-50" },
    { label: "Total Diterima", value: data.total_accepted, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Ditolak", value: data.total_rejected, icon: XCircle, color: "text-red-600 bg-red-50" },
    { label: "Divisi Penuh", value: data.locked_divisions_count, icon: Lock, color: "text-amber-600 bg-amber-50" },
  ];

  const barData = data.applicants_per_division.map((d) => ({
    name: d.division_name.replace("Bidang ", "").replace("UPT ", ""),
    value: d.count,
  }));

  const donutData = data.applicant_type_breakdown.map((d) => ({
    name: formatApplicantType(d.type),
    value: d.count,
  }));

  const lineData = data.monthly_trend.map((d) => ({
    name: getMonthName(d.month).substring(0, 3),
    value: d.count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Dasbor Analitik</h1>
          <p className="page-subtitle">Ringkasan statistik pendaftaran magang Dinas Perhubungan.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          icon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
        >
          {isRefreshing ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} padding="md">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.color}`}>
                <k.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{k.value}</p>
                <p className="text-xs text-surface-500 font-medium">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card padding="lg">
          <CardHeader><CardTitle>Pelamar per Divisi</CardTitle></CardHeader>
          {barData.length > 0 ? (
            <BarChartComponent data={barData} height={280} />
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Belum ada data.</p>
          )}
        </Card>

        {/* Donut Chart */}
        <Card padding="lg">
          <CardHeader><CardTitle>Jenis Pelamar</CardTitle></CardHeader>
          {donutData.length > 0 ? (
            <DonutChart
              data={donutData}
              height={280}
              centerValue={data.total_applicants}
              centerLabel="Total"
            />
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Belum ada data.</p>
          )}
        </Card>
      </div>

      {/* Line Chart */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Tren Pelamar (12 Bulan Terakhir)</CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-surface-400">
            <TrendingUp className="w-3.5 h-3.5" /> Data bulanan
          </div>
        </CardHeader>
        {lineData.length > 0 ? (
          <LineChartComponent data={lineData} height={280} showArea />
        ) : (
          <p className="text-sm text-surface-400 text-center py-8">Belum ada data tren.</p>
        )}
      </Card>

      {/* Division Capacity Table */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-surface-900">Kapasitas Divisi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-surface-50 border-y border-surface-200">
                {["Divisi", "Maks", "Aktif", "Sisa", "Kapasitas"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {data.division_capacity.map((d) => (
                <tr key={d.division_name} className="hover:bg-surface-50">
                  <td className="px-4 py-3 text-sm font-medium text-surface-800">{d.division_name}</td>
                  <td className="px-4 py-3 text-sm text-surface-600">{d.max_quota}</td>
                  <td className="px-4 py-3 text-sm text-surface-600">{d.active_applicants}</td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    <span className={d.max_quota - d.active_applicants <= 0 ? "text-red-600" : "text-emerald-600"}>
                      {d.max_quota - d.active_applicants}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2.5 bg-surface-200 rounded-full overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full transition-all",
                          d.percentage >= 90 ? "bg-red-500" :
                          d.percentage >= 70 ? "bg-amber-500" : "bg-emerald-500"
                        )} style={{ width: `${Math.min(d.percentage, 100)}%` }} />
                      </div>
                      <span className={cn(
                        "text-xs font-semibold min-w-[40px]",
                        d.percentage >= 90 ? "text-red-600" :
                        d.percentage >= 70 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {d.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import type { Application, Division, ApplicationStatus, ApplicantType } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatApplicantType } from "@/lib/utils";
import {
  Search,
  Eye,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

export default function AdminApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [apps, setApps] = useState<Application[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  // Filters
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [filterDivision, setFilterDivision] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 10, sort: "-created_at" };
      if (search) params.search = search;
      if (filterDivision) params.division_id = filterDivision;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.applicant_type = filterType;

      const res = await api.get("/admin/applications", { params });
      const d = res.data.data;
      setApps(d?.data || []);
      setTotalPages(d?.last_page || 1);
      setTotal(d?.total || 0);
    } catch { /* silent */ }
    setLoading(false);
  }, [page, search, filterDivision, filterStatus, filterType]);

  useEffect(() => {
    api.get("/admin/divisions").then((res) => setDivisions(res.data.data || [])).catch(() => {});
    // Fetch unread chat counts
    const fetchUnread = () => {
      api.get("/messages/unread-counts").then((res) => {
        if (res.data.success) setUnreadCounts(res.data.data.per_user || {});
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Debounced search
  const [searchInput, setSearchInput] = useState(initialSearch);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Antrean Pelamar</h1>
        <p className="page-subtitle">Kelola semua pengajuan magang yang masuk.</p>
      </div>

      {/* Filter Bar */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="input-base pl-10" placeholder="Cari nama atau email..." />
          </div>
          <select value={filterDivision} onChange={(e) => { setFilterDivision(e.target.value); setPage(1); }}
            className="input-base sm:w-48">
            <option value="">Semua Divisi</option>
            {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="input-base sm:w-40">
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="reviewing">Ditinjau</option>
            <option value="accepted">Diterima</option>
            <option value="rejected">Ditolak</option>
          </select>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="input-base sm:w-40">
            <option value="">Semua Jenis</option>
            <option value="slta">SLTA</option>
            <option value="mahasiswa">Mahasiswa</option>
            <option value="fresh_graduate">Fresh Graduate</option>
            <option value="instansi">Instansi</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                {["No", "Nama", "Jenis Pelamar", "Divisi", "Skor", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5"><div className="skeleton h-4 w-full rounded" /></td>
                  ))}</tr>
                ))
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <FileText className="w-12 h-12 text-surface-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">Tidak ada pengajuan ditemukan.</p>
                    <p className="text-xs text-surface-400 mt-1">Coba ubah filter pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                apps.map((a, i) => (
                  <tr key={a.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-surface-500">{(page - 1) * 10 + i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-surface-800">{a.user?.name || "-"}</p>
                      <p className="text-xs text-surface-400">{a.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-600">{formatApplicantType(a.user?.applicant_type)}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{a.division?.name || "-"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-surface-700">{a.algorithm_score ?? "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/applications/${a.id}`)}
                          icon={<Eye className="w-4 h-4" />}>Detail</Button>
                        {/* {a.user?.id && unreadCounts[a.user.id] > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-200 animate-pulse" title="Pesan baru dari pelamar">
                            <MessageCircle className="w-3 h-3" />
                            {unreadCounts[a.user.id]}
                          </span>
                        )} */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
            <p className="text-sm text-surface-500">Hal. {page}/{totalPages} ({total} total)</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-2 rounded-md text-surface-500 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-2 rounded-md text-surface-500 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

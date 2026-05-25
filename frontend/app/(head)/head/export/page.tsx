"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Division, ExportLog, ExportFilters } from "@/types";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toastSuccess, toastError, toastInfo } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  Clock,
  User,
  ExternalLink,
  Loader2,
  FileDown,
} from "lucide-react";

export default function HeadExportPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<ExportFilters>({
    date_from: "",
    date_to: "",
    division_id: undefined,
    status: undefined,
    applicant_type: undefined,
  });

  useEffect(() => {
    api.get("/divisions")
      .then((divRes) => {
        setDivisions(divRes.data.data || []);
      })
      .catch(() => setDivisions([]))
      .finally(() => setLoading(false));
  }, []);

  const setFilter = (key: keyof ExportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload: Record<string, any> = {};
      if (filters.date_from) payload.date_from = filters.date_from;
      if (filters.date_to) payload.date_to = filters.date_to;
      if (filters.division_id) payload.division_id = filters.division_id;
      if (filters.status) payload.status = filters.status;
      if (filters.applicant_type) payload.applicant_type = filters.applicant_type;

      const res = await api.post("/head/export", payload, { responseType: "blob" });
      
      // Determine filename from headers or default
      const contentDisposition = res.headers["content-disposition"];
      let filename = "Laporan_Magang.xlsx";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const matches = /filename="([^"]*)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toastSuccess(`Data berhasil diekspor!`);
    } catch (err: any) {
      // If error is blob, try to read as text to parse JSON message
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          toastError(json.message || "Gagal mengekspor data.");
        } catch {
          toastError("Gagal mengekspor data.");
        }
      } else {
        toastError(err.response?.data?.message || "Gagal mengekspor data.");
      }
    } finally {
      setExporting(false);
    }
  };

  const activeFilters = Object.values(filters).filter((v) => v).length;

  if (loading) return (
    <div className="space-y-4">
      <SkeletonCard /><SkeletonCard />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Ekspor Data</h1>
        <p className="page-subtitle">Unduh laporan pengajuan magang dalam format Excel (XLSX).</p>
      </div>

      {/* Filter Panel */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-surface-400" />
            Filter Data
          </CardTitle>
          {activeFilters > 0 && (
            <button onClick={() => setFilters({ date_from: "", date_to: "", division_id: undefined, status: undefined, applicant_type: undefined })}
              className="text-xs text-primary-600 font-medium hover:underline">
              Reset Filter
            </button>
          )}
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="label-base">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="date" value={filters.date_from || ""}
                onChange={(e) => setFilter("date_from", e.target.value)}
                className="input-base pl-10" />
            </div>
          </div>
          <div>
            <label className="label-base">Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="date" value={filters.date_to || ""}
                onChange={(e) => setFilter("date_to", e.target.value)}
                className="input-base pl-10" />
            </div>
          </div>

          {/* Division */}
          <div>
            <label className="label-base">Divisi</label>
            <select value={filters.division_id || ""}
              onChange={(e) => setFilter("division_id", e.target.value)}
              className="input-base">
              <option value="">Semua Divisi</option>
              {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="label-base">Status</label>
            <select value={filters.status || ""}
              onChange={(e) => setFilter("status", e.target.value)}
              className="input-base">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="reviewing">Ditinjau</option>
              <option value="accepted">Diterima</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Applicant Type */}
          <div>
            <label className="label-base">Jenis Pelamar</label>
            <select value={filters.applicant_type || ""}
              onChange={(e) => setFilter("applicant_type", e.target.value)}
              className="input-base">
              <option value="">Semua Jenis</option>
              <option value="slta">SLTA</option>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="fresh_graduate">Fresh Graduate</option>
              <option value="instansi">Instansi</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 pt-4 border-t border-surface-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {activeFilters > 0
                  ? `${activeFilters} filter aktif — data akan disesuaikan.`
                  : "Semua data akan diekspor."}
              </span>
            </div>
            <Button onClick={handleExport} loading={exporting} size="lg"
              icon={<Download className="w-5 h-5" />}
              className="w-full sm:w-auto">
              Ekspor ke Excel (.xlsx)
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}

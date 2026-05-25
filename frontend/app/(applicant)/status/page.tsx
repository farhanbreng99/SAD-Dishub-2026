"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Application } from "@/types";
import Card from "@/components/ui/Card";
import { StatusBadge, RuleBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  FileCheck,
  Hourglass,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function StatusPage() {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    api.get("/applications/my")
      .then((res) => {
        const apps = res.data.data?.data || res.data.data || [];
        if (Array.isArray(apps) && apps.length > 0) setApp(apps[0]);
        else setEmpty(true);
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
  );

  if (empty || !app) return (
    <div className="max-w-2xl mx-auto text-center py-16 animate-fade-in">
      <FileCheck className="w-16 h-16 text-surface-200 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-surface-700">Belum Ada Pengajuan</h2>
      <p className="text-sm text-surface-400 mt-1 mb-6">Anda belum mengajukan magang. Mulai sekarang!</p>
      <a href="/apply" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-700 text-white rounded-lg font-medium text-sm hover:bg-primary-800 transition-colors">
        Ajukan Magang
      </a>
    </div>
  );

  const isEvaluated = app.r1_passed !== null;
  const isDecided = app.status === "accepted" || app.status === "rejected";

  // Timeline nodes
  const nodes = [
    {
      key: "submitted",
      icon: FileCheck,
      title: "Berkas Diterima",
      time: formatDateTime(app.created_at),
      active: true,
      completed: true,
    },
    {
      key: "evaluating",
      icon: Hourglass,
      title: "Sedang Dievaluasi",
      time: isEvaluated ? "Evaluasi selesai" : "Menunggu proses admin",
      active: app.status !== "pending",
      completed: isEvaluated,
    },
    {
      key: "decided",
      icon: app.status === "accepted" ? CheckCircle2 : app.status === "rejected" ? XCircle : Clock,
      title: "Keputusan Akhir",
      time: isDecided ? formatDateTime(app.updated_at) : "Belum diputuskan",
      active: isDecided,
      completed: isDecided,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Status Pengajuan</h1>
        <p className="page-subtitle">Pantau perkembangan pengajuan magang Anda.</p>
      </div>

      {/* Timeline */}
      <Card padding="lg">
        <div className="space-y-0">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.key} className="flex gap-4">
                {/* Line & Dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    node.completed ? "bg-primary-700 border-primary-700 text-white" :
                    node.active ? "bg-white border-primary-400 text-primary-600" :
                    "bg-surface-100 border-surface-300 text-surface-400"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {i < nodes.length - 1 && (
                    <div className={`w-0.5 h-12 my-1 ${node.completed ? "bg-primary-700" : "bg-surface-200"}`} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-6 pt-1.5">
                  <p className={`text-sm font-semibold ${node.active ? "text-surface-900" : "text-surface-400"}`}>
                    {node.title}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">{node.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Rule Results (after algorithm executed) */}
      {isEvaluated && (
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-surface-900 mb-3">Hasil Evaluasi Algoritma</h3>
          <div className="flex flex-wrap gap-2">
            <RuleBadge passed={app.r1_passed} label="R1 Dokumen" />
            <RuleBadge passed={app.r3_passed} label="R3 Kuota" />
            <RuleBadge passed={app.r4_passed} label="R4 Kesesuaian" />
          </div>
          {app.algorithm_score !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-surface-500">Skor Algoritma:</span>
              <span className="text-sm font-bold text-primary-700">{app.algorithm_score}/100</span>
              <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden max-w-[200px]">
                <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${app.algorithm_score}%` }} />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Decision Card */}
      <Card padding="lg" className={
        app.status === "accepted" ? "bg-emerald-50 border-emerald-200" :
        app.status === "rejected" ? "bg-red-50 border-red-200" :
        "bg-blue-50 border-blue-200"
      }>
        <div className="flex items-start gap-3">
          {app.status === "accepted" ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : app.status === "rejected" ? (
            <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className={`text-base font-semibold ${
              app.status === "accepted" ? "text-emerald-800" :
              app.status === "rejected" ? "text-red-800" :
              "text-blue-800"
            }`}>
              {app.status === "accepted" ? "Pengajuan Diterima! 🎉" :
               app.status === "rejected" ? "Pengajuan Ditolak" :
               "Pengajuan Sedang Diproses"}
            </h3>
            {app.status === "accepted" && app.recommended_division && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-emerald-700">
                <MapPin className="w-4 h-4" />
                <span>Penempatan: <strong>{app.recommended_division.name}</strong></span>
              </div>
            )}
            {app.status === "rejected" && app.rejection_reason && (
              <div className="mt-2 text-sm text-red-700">
                <p className="font-medium">Alasan:</p>
                <p className="mt-0.5">{app.rejection_reason}</p>
              </div>
            )}
            {(app.status === "pending" || app.status === "reviewing") && (
              <p className="mt-1 text-sm text-blue-700">
                Sedang diproses oleh admin. Harap tunggu notifikasi selanjutnya.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

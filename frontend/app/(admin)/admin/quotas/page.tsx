"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Division } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toastSuccess, toastError, toastWarning } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  Edit3,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";

export default function AdminQuotasPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDiv, setEditDiv] = useState<Division | null>(null);
  const [newQuota, setNewQuota] = useState("");
  const [saving, setSaving] = useState(false);

  const lockedCount = divisions.filter((d) => d.is_locked).length;

  const fetchDivisions = async () => {
    try {
      const res = await api.get("/admin/divisions");
      setDivisions(res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchDivisions(); }, []);

  const handleSave = async () => {
    if (!editDiv || !newQuota) return;
    const val = parseInt(newQuota);
    if (isNaN(val) || val < 0) { toastError("Kuota harus berupa angka positif."); return; }
    if (val < editDiv.active_applicants) {
      toastWarning("Kuota tidak boleh lebih kecil dari jumlah pelamar aktif.");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/admin/divisions/${editDiv.id}`, { max_quota: val });
      toastSuccess("Kuota divisi berhasil diperbarui.");
      setEditDiv(null);
      fetchDivisions();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Gagal memperbarui kuota.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Kelola Kuota Divisi</h1>
        <p className="page-subtitle">Atur kapasitas penerimaan magang per divisi.</p>
      </div>

      {/* Locked Alert */}
      {lockedCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {lockedCount} divisi terkunci otomatis (R5)
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Divisi yang kuotanya penuh akan otomatis terkunci dan tidak menerima pelamar baru. Tambahkan kuota untuk membukanya kembali.
            </p>
          </div>
        </div>
      )}

      {/* Divisions Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                {["Divisi", "Maks Kuota", "Pelamar Aktif", "Sisa Kuota", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {divisions.map((d) => {
                const remaining = d.max_quota - d.active_applicants;
                const pct = d.max_quota > 0 ? (d.active_applicants / d.max_quota) * 100 : 0;
                return (
                  <tr key={d.id} className={cn(
                    "transition-colors",
                    d.is_locked && "bg-red-50/40"
                  )}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.is_locked ? "bg-red-100" : "bg-primary-50"}`}>
                          {d.is_locked ? <Lock className="w-4 h-4 text-red-500" /> : <Building2 className="w-4 h-4 text-primary-600" />}
                        </div>
                        <span className="text-sm font-medium text-surface-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-surface-700">{d.max_quota}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-surface-700">{d.active_applicants}</span>
                        <div className="w-16 h-2 bg-surface-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                          }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold">
                      <span className={remaining <= 0 ? "text-red-600" : "text-emerald-600"}>{remaining}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {d.is_locked ? (
                        <StatusBadge status="locked" />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                          <Unlock className="w-3 h-3" /> Buka
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Button variant="ghost" size="sm" icon={<Edit3 className="w-4 h-4" />}
                        onClick={() => { setEditDiv(d); setNewQuota(String(d.max_quota)); }}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={!!editDiv} onClose={() => setEditDiv(null)} title="Edit Kuota Divisi"
        description={editDiv?.name}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditDiv(null)}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>Simpan</Button>
          </>
        }>
        {editDiv && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-400">Pelamar Aktif</p>
                <p className="text-lg font-bold text-surface-900">{editDiv.active_applicants}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50">
                <p className="text-xs text-surface-400">Status</p>
                <p className="text-lg font-bold">{editDiv.is_locked ?
                  <span className="text-red-600">Terkunci</span> :
                  <span className="text-emerald-600">Terbuka</span>}
                </p>
              </div>
            </div>
            <div>
              <label className="label-base">Kuota Maksimum Baru</label>
              <input type="number" min={editDiv.active_applicants} value={newQuota}
                onChange={(e) => setNewQuota(e.target.value)}
                className="input-base" placeholder="Masukkan kuota baru" />
              <p className="text-xs text-surface-400 mt-1">Minimal: {editDiv.active_applicants} (jumlah pelamar aktif saat ini)</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import type { Application, Division, ApplicationDetail } from "@/types";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StatusBadge, RuleBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { formatApplicantType, formatDate, formatDocumentType } from "@/lib/utils";
import AdminChatPanel from "@/components/ui/AdminChatPanel";
import { getCachedUser } from "@/lib/auth";
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  BookOpen,
  MapPin,
  Calendar,
  FileText,
  Eye,
  Cpu,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState(false);

  // Decision state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [decisionDivision, setDecisionDivision] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const cachedUser = getCachedUser();
  const adminId = cachedUser?.id || 0;

  useEffect(() => {
    Promise.all([
      api.get(`/admin/applications/${id}`),
      api.get("/admin/divisions"),
    ])
      .then(([appRes, divRes]) => {
        setDetail(appRes.data.data);
        setDivisions(divRes.data.data || []);
      })
      .catch(() => toastError("Gagal memuat data."))
      .finally(() => setLoading(false));
  }, [id]);

  const app = detail?.application;
  const rules = detail?.rule_results;

  // ─── Execute Sort Algorithm (Decision Support) ──
  const executeSort = async () => {
    setSorting(true);
    try {
      const res = await api.post(`/admin/applications/${id}/execute-sort`);
      setDetail(res.data.data);
      toastSuccess(res.data.message || "Algoritma berhasil dijalankan.");
    } catch (err: any) {
      toastError(err.response?.data?.message || "Gagal menjalankan algoritma.");
    } finally {
      setSorting(false);
    }
  };

  // ─── Accept / Reject ────────────────────────────
  const handleDecision = async (decision: "accepted" | "rejected") => {
    setDeciding(true);
    try {
      const payload: any = { decision };
      if (decision === "accepted") {
        if (decisionDivision) payload.division_id = decisionDivision;
        if (adminNote.trim()) payload.admin_note = adminNote.trim();
      }
      if (decision === "rejected") payload.rejection_reason = rejectReason;

      const res = await api.patch(`/admin/applications/${id}/decide`, payload);
      setDetail({
        application: res.data.data,
        rule_results: detail?.rule_results || ({} as any),
      });
      toastSuccess(res.data.message || "Keputusan berhasil disimpan.");
      setShowAcceptModal(false);
      setShowRejectModal(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Gagal menyimpan keputusan.");
    } finally {
      setDeciding(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      <SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
  );

  if (!app) return (
    <div className="text-center py-16">
      <p className="text-surface-500">Data tidak ditemukan.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.back()}>Kembali</Button>
    </div>
  );

  const isReviewing = app.status === "reviewing";
  const isPending = app.status === "pending";
  const canDecide = isPending || isReviewing;
  const isDecided = app.status === "accepted" || app.status === "rejected";
  const rulesEvaluated = app.r1_passed !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/applications")}
            className="p-2 rounded-lg hover:bg-surface-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-surface-500" />
          </button>
          <div>
            <h1 className="page-title">Detail Pengajuan</h1>
            <p className="page-subtitle">ID: #{app.id}</p>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Applicant Profile */}
      <Card padding="lg">
        <CardHeader><CardTitle>Profil Pemohon</CardTitle></CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: User, label: "Nama", value: app.user?.name },
            { icon: Mail, label: "Email", value: app.user?.email },
            { icon: Phone, label: "Telepon", value: app.user?.phone },
            { icon: GraduationCap, label: "Jenis Pemohon", value: formatApplicantType(app.user?.applicant_type) },
            { icon: Building, label: "Institusi", value: app.user?.institution_name || app.institution_name },
            { icon: BookOpen, label: "Program Studi", value: app.study_program },
            { icon: MapPin, label: "Divisi Tujuan", value: app.division?.name },
            { icon: Calendar, label: "Tanggal Mulai", value: formatDate(app.internship_start) },
            { icon: Calendar, label: "Tanggal Selesai", value: formatDate(app.internship_end) },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-surface-500" />
              </div>
              <div>
                <p className="text-xs text-surface-400">{item.label}</p>
                <p className="text-sm font-medium text-surface-800">{item.value || "-"}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Documents */}
      <Card padding="lg">
        <CardHeader><CardTitle>Dokumen</CardTitle></CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["cv", "cover_letter", "id_card", "proposal"] as const).map((type) => {
            const doc = app.documents?.find((d) => d.type === type);
            return (
              <div key={type} className={`p-4 rounded-xl border ${doc ? "border-emerald-200 bg-emerald-50/30" : "border-surface-200 bg-surface-50"}`}>
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${doc ? "text-emerald-600" : "text-surface-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-700">{formatDocumentType(type)}</p>
                    <p className="text-[11px] text-surface-400 truncate">{doc?.file_name || "Belum diunggah"}</p>
                  </div>
                  {doc && (
                    <button onClick={() => setPreviewDoc({ url: doc.file_url || doc.file_path, title: formatDocumentType(type) })}
                      className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-600"
                      title="Lihat Dokumen">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Algorithm Sort (Decision Support) */}
      {canDecide && (
        <Card padding="lg">
          <div className="text-center">
            <Cpu className="w-10 h-10 text-primary-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-surface-900 mb-1">
              {rulesEvaluated ? "Jalankan Ulang Algoritma Sortir" : "Jalankan Algoritma Sortir"}
            </h3>
            <p className="text-sm text-surface-500 mb-4">
              Evaluasi kelengkapan dokumen (R1), kuota divisi (R3), dan kesesuaian (R4).
              <br />
              <span className="text-xs text-surface-400 italic">
                Hasil hanya sebagai pendukung keputusan — keputusan akhir ada di tangan Admin.
              </span>
            </p>
            <Button onClick={executeSort} loading={sorting} icon={<Cpu className="w-4 h-4" />} size="lg">
              {rulesEvaluated ? "Evaluasi Ulang" : "Eksekusi Algoritma Sortir"}
            </Button>
          </div>
        </Card>
      )}

      {/* Rule Results */}
      {rulesEvaluated && (
        <Card padding="lg">
          <CardHeader><CardTitle>Hasil Evaluasi Algoritma (Pendukung Keputusan)</CardTitle></CardHeader>
          <div className="space-y-4">
            {/* Recommendation Banner */}
            {rules?.recommendation && (
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${rules.all_passed
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
                }`}>
                <Lightbulb className={`w-5 h-5 mt-0.5 shrink-0 ${rules.all_passed ? "text-emerald-600" : "text-amber-600"
                  }`} />
                <div>
                  <p className={`text-sm font-semibold ${rules.all_passed ? "text-emerald-800" : "text-amber-800"
                    }`}>Rekomendasi Sistem</p>
                  <p className={`text-sm mt-0.5 ${rules.all_passed ? "text-emerald-700" : "text-amber-700"
                    }`}>{rules.recommendation}</p>
                </div>
              </div>
            )}

            {/* Warnings */}
            {rules?.warnings && rules.warnings.length > 0 && (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Catatan
                </p>
                <ul className="space-y-1">
                  {rules.warnings.map((w: string, i: number) => (
                    <li key={i} className="text-xs text-amber-700">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rule Cards */}
            {[
              { label: "R1 — Kelengkapan Dokumen", passed: app.r1_passed, detail: rules?.r1_detail },
              { label: "R3 — Kuota Divisi", passed: app.r3_passed, detail: rules?.r3_detail },
              { label: "R4 — Kesesuaian Kata Kunci", passed: app.r4_passed, detail: rules?.r4_detail },
            ].map((rule) => (
              <div key={rule.label} className={`flex items-center gap-3 p-3 rounded-lg border ${rule.passed ? "border-emerald-200 bg-emerald-50/50" :
                  rule.passed === false ? "border-amber-200 bg-amber-50/50" :
                    "border-surface-200 bg-surface-50"
                }`}>
                {rule.passed ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> :
                  rule.passed === false ? <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /> :
                    <Shield className="w-5 h-5 text-surface-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800">{rule.label}</p>
                  {rule.detail && <p className="text-xs text-surface-500 mt-0.5">{rule.detail}</p>}
                </div>
              </div>
            ))}

            {/* Score Bar */}
            {app.algorithm_score !== null && (
              <div className="mt-2 p-3 bg-surface-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-surface-700">Skor Kesesuaian</span>
                  <span className="text-lg font-bold text-primary-700">{app.algorithm_score}/100</span>
                </div>
                <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${app.algorithm_score >= 60 ? "bg-emerald-500" : "bg-amber-500"
                    }`} style={{ width: `${app.algorithm_score}%` }} />
                </div>
                <p className="text-xs text-surface-400 mt-1.5 text-center">
                  Ambang batas: 60 — {app.algorithm_score >= 60 ? "Di atas batas ✓" : "Di bawah batas (perlu pertimbangan)"}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Decision Section — available for pending & reviewing */}
      {canDecide && (
        <Card padding="lg" className="border-2 border-primary-100">
          <CardHeader><CardTitle>Keputusan Admin</CardTitle></CardHeader>
          <p className="text-sm text-surface-500 mb-4">
            Tentukan keputusan akhir untuk pengajuan ini. Anda dapat menjalankan algoritma terlebih dahulu sebagai bahan pertimbangan, atau langsung mengambil keputusan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" className="flex-1 !bg-emerald-600 hover:!bg-emerald-700"
              icon={<CheckCircle className="w-5 h-5" />}
              onClick={() => {
                setDecisionDivision(app.division_id);
                setShowAcceptModal(true);
              }}>
              Terima Pelamar
            </Button>
            <Button variant="danger" size="lg" className="flex-1"
              icon={<XCircle className="w-5 h-5" />}
              onClick={() => setShowRejectModal(true)}>
              Tolak Pelamar
            </Button>
          </div>
        </Card>
      )}

      {/* Result if already decided */}
      {isDecided && (
        <Card padding="lg" className={app.status === "accepted" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
          <div className="flex items-start gap-3">
            {app.status === "accepted" ? <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" /> : <XCircle className="w-6 h-6 text-red-600 mt-0.5" />}
            <div>
              <p className={`text-base font-semibold ${app.status === "accepted" ? "text-emerald-800" : "text-red-800"}`}>
                {app.status === "accepted" ? "Pengajuan Diterima" : "Pengajuan Ditolak"}
              </p>
              {app.status === "accepted" && app.recommended_division && (
                <p className="text-sm text-emerald-700 mt-1">Ditempatkan di: <strong>{app.recommended_division.name}</strong></p>
              )}
              {app.status === "accepted" && app.admin_note && (
                <p className="text-sm text-emerald-700 mt-1">Catatan Admin: {app.admin_note}</p>
              )}
              {app.status === "rejected" && app.rejection_reason && (
                <p className="text-sm text-red-700 mt-1">Alasan: {app.rejection_reason}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ═══ Accept Modal ═══ */}
      <Modal isOpen={showAcceptModal} onClose={() => setShowAcceptModal(false)} title="Terima Pengajuan"
        description={`Apakah Anda yakin menerima pengajuan dari ${app.user?.name}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>Batal</Button>
            <Button className="!bg-emerald-600 hover:!bg-emerald-700" loading={deciding}
              onClick={() => handleDecision("accepted")}>Konfirmasi Terima</Button>
          </>
        }>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="label-base">Divisi Penempatan</label>
            <select value={decisionDivision || ""} onChange={(e) => setDecisionDivision(Number(e.target.value))}
              className="input-base">
              {divisions.filter((d) => !d.is_locked).map((d) => (
                <option key={d.id} value={d.id}>{d.name} (sisa: {d.max_quota - d.active_applicants})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-base">Catatan (Opsional)</label>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
              className="input-base h-24 resize-none" placeholder="Tambahkan catatan untuk pelamar jika diperlukan..." />
            <p className="text-xs text-surface-400">Catatan ini akan dikirimkan bersama dengan notifikasi penerimaan ke pelamar.</p>
          </div>
        </div>
      </Modal>

      {/* ═══ Reject Modal ═══ */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Tolak Pengajuan"
        description={`Apakah Anda yakin menolak pengajuan dari ${app.user?.name}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Batal</Button>
            <Button variant="danger" loading={deciding} disabled={!rejectReason.trim()}
              onClick={() => handleDecision("rejected")}>Konfirmasi Tolak</Button>
          </>
        }>
        <div className="space-y-3">
          <label className="label-base">Alasan Penolakan <span className="text-red-500">*</span></label>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            className="input-base h-28 resize-none" placeholder="Tuliskan alasan penolakan..." />
          <p className="text-xs text-surface-400">Alasan ini akan dikirimkan ke pelamar sebagai notifikasi.</p>
        </div>
      </Modal>

      {/* ═══ Document Preview Modal ═══ */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={`Preview Dokumen: ${previewDoc?.title}`} size="xl">
        {previewDoc && (
          <div className="w-full h-[70vh] bg-surface-100 rounded-lg overflow-hidden border border-surface-200">
            <iframe
              src={previewDoc.url}
              className="w-full h-full"
              title={previewDoc.title}
            />
          </div>
        )}
      </Modal>

      {/* ═══ Chat Panel (Temporarily Disabled) ═══ */}
      {/* {adminId > 0 && app?.user?.id && (
        <AdminChatPanel userId={app.user.id} adminId={adminId} />
      )} */}
    </div>
  );
}

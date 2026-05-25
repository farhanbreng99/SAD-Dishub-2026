"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCachedUser } from "@/lib/auth";
import api from "@/lib/axios";
import type { Division } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import StepIndicator from "@/components/forms/StepIndicator";
import UploadDropzone from "@/components/forms/UploadDropzone";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  Lock,
  ChevronRight,
  ChevronLeft,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const steps = [
  { label: "Pilih Divisi", description: "Tentukan penempatan" },
  { label: "Isi Data Diri", description: "Lengkapi informasi" },
  { label: "Unggah Dokumen", description: "Upload berkas" },
];

export default function ApplyPage() {
  const router = useRouter();
  const user = getCachedUser();

  const [step, setStep] = useState(0);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divLoading, setDivLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form state
  const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    institution_name: user?.institution_name || "",
    study_program: "",
    internship_start: "",
    internship_end: "",
  });
  const [files, setFiles] = useState<{ cv: File | null; cover_letter: File | null; id_card: File | null; proposal: File | null }>({
    cv: null,
    cover_letter: null,
    id_card: null,
    proposal: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/divisions")
      .then((res) => setDivisions(res.data.data || []))
      .catch(() => toastError("Gagal memuat data divisi."))
      .finally(() => setDivLoading(false));
  }, []);

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !selectedDivision) e.division = "Pilih salah satu divisi.";
    if (step === 1) {
      if (!formData.institution_name.trim()) e.institution_name = "Wajib diisi.";
      if (!formData.study_program.trim()) e.study_program = "Wajib diisi.";
      if (!formData.internship_start) e.internship_start = "Wajib diisi.";
      if (!formData.internship_end) e.internship_end = "Wajib diisi.";
      if (formData.internship_start && formData.internship_end && formData.internship_start > formData.internship_end)
        e.internship_end = "Harus setelah tanggal mulai.";
    }
    if (step === 2) {
      if (!files.cv) e.cv = "CV wajib diunggah.";
      if (!files.cover_letter) e.cover_letter = "Surat pengantar wajib diunggah.";
      if (!files.id_card) e.id_card = "Kartu identitas wajib diunggah.";
      if (!files.proposal) e.proposal = "Proposal wajib diunggah.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 2)); };
  const prevStep = () => { setErrors({}); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setShowConfirm(false);
    setSubmitting(true);

    let applicationId: number | null = null;

    try {
      // 1. Buat pengajuan terlebih dahulu
      const appRes = await api.post("/applications", {
        division_id: selectedDivision,
        ...formData,
      });
      applicationId = appRes.data.data?.id;

      if (!applicationId) throw new Error("Gagal mendapatkan ID pengajuan dari server.");

      // 2. Upload semua dokumen
      const fd = new FormData();
      if (files.cv) fd.append("cv", files.cv);
      if (files.cover_letter) fd.append("cover_letter", files.cover_letter);
      if (files.id_card) fd.append("id_card", files.id_card);
      if (files.proposal) fd.append("proposal", files.proposal);

      await api.post(`/applications/${applicationId}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toastSuccess("Pengajuan magang berhasil dikirim!");
      router.push("/status");
    } catch (err: any) {
      // Jika upload gagal, hapus pengajuan yang sudah terbuat agar tidak masuk ke admin
      if (applicationId) {
        try {
          await api.delete(`/applications/${applicationId}`);
        } catch {
          // Abaikan error rollback, tetap tampilkan error utama
        }
      }

      const message = err.response?.data?.message || err.message || "Gagal mengirim pengajuan.";
      toastError(`Pengajuan dibatalkan: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDiv = divisions.find((d) => d.id === selectedDivision);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Pengajuan Magang</h1>
        <p className="page-subtitle">Lengkapi 3 langkah berikut untuk mengajukan magang.</p>
      </div>

      {/* Step Indicator */}
      <Card padding="md">
        <StepIndicator steps={steps} currentStep={step} />
      </Card>

      {/* ═══ Step 1: Pilih Divisi ═══ */}
      {step === 0 && (
        <div className="space-y-4">
          {errors.division && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4" /> {errors.division}
            </div>
          )}
          {divLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {divisions.map((div) => {
                const isSelected = selectedDivision === div.id;
                const isFull = div.is_locked || div.active_applicants >= div.max_quota;
                return (
                  <Card
                    key={div.id}
                    padding="md"
                    hover={!isFull}
                    onClick={isFull ? undefined : () => setSelectedDivision(div.id)}
                    className={cn(
                      "transition-all",
                      isFull && "opacity-60 cursor-not-allowed",
                      isSelected && "ring-2 ring-primary-500 border-primary-400"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isFull ? "bg-surface-100" : isSelected ? "bg-primary-100" : "bg-primary-50"
                      )}>
                        {isFull ? <Lock className="w-5 h-5 text-surface-400" /> : <Building2 className="w-5 h-5 text-primary-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-surface-900 truncate">{div.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Users className="w-3.5 h-3.5 text-surface-400" />
                          {isFull ? (
                            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Penuh</span>
                          ) : (
                            <span className="text-xs text-surface-500">
                              Sisa kuota: <span className="font-semibold text-primary-700">{div.max_quota - div.active_applicants}</span>/{div.max_quota}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary-600 shrink-0" />}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Step 2: Isi Data Diri ═══ */}
      {step === 1 && (
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-4">Data Diri Pemohon</h3>
          <div className="space-y-4">
            <div>
              <label className="label-base">Nama Institusi / Sekolah</label>
              <input value={formData.institution_name}
                onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                className={`input-base ${errors.institution_name ? "input-error" : ""}`}
                placeholder="Contoh: UIN Sunan Ampel Surabaya" />
              {errors.institution_name && <p className="text-xs text-red-500 mt-1">{errors.institution_name}</p>}
            </div>
            <div>
              <label className="label-base">Program Studi / Jurusan</label>
              <input value={formData.study_program}
                onChange={(e) => setFormData({ ...formData, study_program: e.target.value })}
                className={`input-base ${errors.study_program ? "input-error" : ""}`}
                placeholder="Contoh: Sistem Informasi" />
              {errors.study_program && <p className="text-xs text-red-500 mt-1">{errors.study_program}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-base">Tanggal Mulai</label>
                <input type="date" value={formData.internship_start}
                  onChange={(e) => setFormData({ ...formData, internship_start: e.target.value })}
                  className={`input-base ${errors.internship_start ? "input-error" : ""}`} />
                {errors.internship_start && <p className="text-xs text-red-500 mt-1">{errors.internship_start}</p>}
              </div>
              <div>
                <label className="label-base">Tanggal Selesai</label>
                <input type="date" value={formData.internship_end}
                  onChange={(e) => setFormData({ ...formData, internship_end: e.target.value })}
                  className={`input-base ${errors.internship_end ? "input-error" : ""}`} />
                {errors.internship_end && <p className="text-xs text-red-500 mt-1">{errors.internship_end}</p>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ Step 3: Unggah Dokumen ═══ */}
      {step === 2 && (
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-4">Unggah Berkas</h3>
          <div className="space-y-5">
            <UploadDropzone label="Curriculum Vitae (CV)" description="Format PDF, maks 2 MB"
              maxSize={2 * 1024 * 1024}
              accept={{ "application/pdf": [".pdf"] }}
              value={files.cv} onChange={(f) => setFiles({ ...files, cv: f })}
              error={errors.cv} />
            <UploadDropzone label="Surat Pengantar" description="Format PDF, maks 2 MB"
              maxSize={2 * 1024 * 1024}
              accept={{ "application/pdf": [".pdf"] }}
              value={files.cover_letter} onChange={(f) => setFiles({ ...files, cover_letter: f })}
              error={errors.cover_letter} />
            <UploadDropzone label="Kartu Identitas (KTP/KTM)" description="Format PDF atau JPG, maks 2 MB"
              maxSize={2 * 1024 * 1024}
              accept={{ "application/pdf": [".pdf"], "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
              value={files.id_card} onChange={(f) => setFiles({ ...files, id_card: f })}
              error={errors.id_card} />
            <UploadDropzone label="Proposal Magang" description="Format PDF, maks 10 MB"
              maxSize={10 * 1024 * 1024}
              accept={{ "application/pdf": [".pdf"] }}
              value={files.proposal} onChange={(f) => setFiles({ ...files, proposal: f })}
              error={errors.proposal} />
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={prevStep} disabled={step === 0}
          icon={<ChevronLeft className="w-4 h-4" />}>
          Kembali
        </Button>
        {step < 2 ? (
          <Button onClick={nextStep} icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
            Selanjutnya
          </Button>
        ) : (
          <Button onClick={() => { if (validateStep()) setShowConfirm(true); }}
            loading={submitting} icon={<Send className="w-4 h-4" />}
            disabled={!files.cv || !files.cover_letter || !files.id_card || !files.proposal}>
            Kirim Pengajuan
          </Button>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Konfirmasi Pengajuan"
        description="Pastikan data sudah benar sebelum mengirim."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Batal</Button>
            <Button onClick={handleSubmit} loading={submitting}>Kirim Sekarang</Button>
          </>
        }>
        <div className="space-y-3 text-sm">
          <p><span className="font-medium text-surface-600">Divisi:</span> {selectedDiv?.name || "-"}</p>
          <p><span className="font-medium text-surface-600">Institusi:</span> {formData.institution_name}</p>
          <p><span className="font-medium text-surface-600">Prodi:</span> {formData.study_program}</p>
          <p><span className="font-medium text-surface-600">Periode:</span> {formData.internship_start} s/d {formData.internship_end}</p>
          <p><span className="font-medium text-surface-600">Dokumen:</span> {[files.cv?.name, files.cover_letter?.name, files.id_card?.name, files.proposal?.name].filter(Boolean).join(", ")}</p>
        </div>
      </Modal>
    </div>
  );
}

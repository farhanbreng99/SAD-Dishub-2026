"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import type { ApplicantType, RegisterFormData } from "@/types";
import { Building2, User, Mail, Lock, Phone, GraduationCap, Building, Eye, EyeOff } from "lucide-react";

const applicantTypes: { value: ApplicantType; label: string }[] = [
  { value: "slta", label: "Siswa SLTA / Sederajat" },
  { value: "mahasiswa", label: "Mahasiswa" },
  { value: "fresh_graduate", label: "Fresh Graduate" },
  { value: "instansi", label: "Instansi / Perseorangan" },
];

// Moved Input component outside to prevent re-mounting and losing focus
const Input = ({
  label, icon: Icon, id, type = "text", placeholder, error, value, onChange, ...rest
}: any) => (
  <div>
    <label htmlFor={id} className="label-base">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      <input
        id={id} type={type} value={value} onChange={onChange}
        className={`input-base pl-10 ${error ? "input-error" : ""}`}
        placeholder={placeholder} {...rest}
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    applicant_type: "mahasiswa",
    institution_name: "",
    phone: "",
  });

  const set = (key: keyof RegisterFormData, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nama lengkap wajib diisi.";
    if (!form.email.trim()) e.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid.";
    if (!form.password) e.password = "Password wajib diisi.";
    else if (form.password.length < 8) e.password = "Password minimal 8 karakter.";
    if (form.password !== form.password_confirmation) e.password_confirmation = "Konfirmasi password tidak cocok.";
    if (!form.institution_name.trim()) e.institution_name = "Nama institusi wajib diisi.";
    if (!form.phone.trim()) e.phone = "Nomor telepon wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      toastSuccess("Registrasi berhasil! Selamat datang.");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registrasi gagal. Coba lagi.";
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(fieldErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      }
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nama Lengkap" icon={User} id="name" placeholder="Masukkan nama lengkap"
          value={form.name} onChange={(e: any) => set("name", e.target.value)} error={errors.name} />

        <Input label="Alamat Email" icon={Mail} id="email" type="email" placeholder="nama@email.com"
          value={form.email} onChange={(e: any) => set("email", e.target.value)} error={errors.email} />

        {/* Password */}
        <div>
          <label htmlFor="password" className="text-sm font-medium text-surface-700 mb-1.5 block">Kata Sandi</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input id="password" type={showPw ? "text" : "password"} value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={`input-base pl-10 pr-10 ${errors.password ? "input-error" : ""}`}
              placeholder="Buat kata sandi" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none" tabIndex={-1}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <Input label="Konfirmasi Kata Sandi" icon={Lock} id="password_confirmation" type="password"
          placeholder="Ulangi kata sandi" value={form.password_confirmation}
          onChange={(e: any) => set("password_confirmation", e.target.value)} error={errors.password_confirmation} />

        {/* Applicant Type */}
        <div>
          <label htmlFor="applicant_type" className="text-sm font-medium text-surface-700 mb-1.5 block">Jenis Pendaftar</label>
          <div className="relative">
            <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <select id="applicant_type" value={form.applicant_type}
              onChange={(e) => set("applicant_type", e.target.value)}
              className="input-base pl-10 appearance-none cursor-pointer">
              {applicantTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Input label="Nama Institusi" icon={Building} id="institution_name"
          placeholder="Contoh: UIN Sunan Ampel Surabaya" value={form.institution_name}
          onChange={(e: any) => set("institution_name", e.target.value)} error={errors.institution_name} />

        <Input label="Nomor Telepon" icon={Phone} id="phone" type="tel"
          placeholder="+62 812..." value={form.phone}
          onChange={(e: any) => set("phone", e.target.value)} error={errors.phone} />

        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-4">
          Buat Akun
        </Button>
      </form>
    </div>
  );
}

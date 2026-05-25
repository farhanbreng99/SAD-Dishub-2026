"use client";

import React, { useState, useEffect } from "react";
import { getCachedUser, saveUser } from "@/lib/auth";
import api from "@/lib/axios";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { User, Phone, Building, Mail, GraduationCap } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(getCachedUser());
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    institution_name: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        institution_name: user.institution_name || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/me", form);
      const updatedUser = res.data.data.user;
      
      // Update local storage and state
      saveUser(updatedUser);
      setUser(updatedUser);
      
      toastSuccess("Profil berhasil diperbarui!");
    } catch (err: any) {
      toastError(err.response?.data?.message || "Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Profil Saya</h1>
        <p className="text-surface-500 text-sm mt-1">Kelola informasi data diri dan kontak Anda.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-surface-200 overflow-hidden">
        {/* Header Profile */}
        <div className="bg-primary-50 px-6 py-8 flex flex-col sm:flex-row items-center gap-6 border-b border-surface-200">
          <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shrink-0">
            <span className="text-3xl font-bold text-white">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-surface-900">{user.name}</h2>
            <p className="text-primary-700 font-medium capitalize mt-0.5">{user.applicant_type?.replace('_', ' ')}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-surface-500 text-sm">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Form Edit */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label-base">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-base pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-base">Nomor Telepon</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-base pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-base">Nama Institusi</label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={form.institution_name}
                onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
                className="input-base pl-10"
                required
              />
            </div>
          </div>

          {/* Readonly Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-surface-100">
             <div>
              <label className="label-base text-surface-400">Email (Tidak dapat diubah)</label>
              <div className="relative opacity-70">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="text" value={user.email} disabled className="input-base pl-10 bg-surface-50" />
              </div>
            </div>
             <div>
              <label className="label-base text-surface-400">Tipe Pemohon (Tidak dapat diubah)</label>
              <div className="relative opacity-70">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="text" value={user.applicant_type?.replace('_', ' ') || ''} disabled className="input-base pl-10 bg-surface-50 capitalize" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" loading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

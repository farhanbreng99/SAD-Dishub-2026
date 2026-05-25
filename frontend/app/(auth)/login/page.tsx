"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/auth";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid.";
    if (!form.password) e.password = "Password wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await login(form);
      toastSuccess(`Selamat datang, ${data.user.name}!`);
      const dest = redirect || getRoleDashboardPath(data.role);
      router.push(dest);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Email atau password salah.";
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700">Alamat Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`input-base pl-10 ${errors.email ? "input-error" : ""}`}
              placeholder="nama@email.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700">Kata Sandi</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`input-base pl-10 pr-10 ${errors.password ? "input-error" : ""}`}
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        <div className="flex justify-end mt-[-8px]">
          <Link href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
            Lupa Kata Sandi?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
          Masuk
        </Button>
      </form>
    </div>
  );
}

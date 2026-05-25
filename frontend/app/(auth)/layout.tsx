"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="bg-surface-50 font-sans text-surface-900 min-h-screen flex relative overflow-x-hidden">
      {/* Left Side Image */}
      <div 
        className="hidden lg:block lg:w-1/2 relative bg-cover bg-center" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFp7zg_2kGKjPxvVs1iq6j7ybPHpiT3zmV0fhW35PnDP-Mb2GClDSUPA4MS2_r4m6mQljANzhIAICZPeb-Zl96Q7g055J2nPNf8ChZHMU8NiYGk8dwqits2C4fTItv1LSGckYpbs_S4C2PPAEkj8QctvpC1TwI940KvEes8bGdiJEJPtPyqf_8TKQNE13PccxSSpsO4e_4qJGqudPb4MMXg4dyQca0iPfsZASk3T25HzR26p3NxrUTouWeIgRFXztN4DByVPM9LrE')" }}
      >
        <div className="absolute inset-0 bg-primary-800/60 mix-blend-multiply"></div>
      </div>
      
      {/* Right Side Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white">
        <main className="w-full max-w-[480px] z-10 bg-white rounded-xl overflow-hidden flex flex-col shadow-sm border border-surface-100">
          {/* Header / Branding */}
          <div className="px-6 pt-10 pb-6 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-700 mb-2">
                <Building2 className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-1">E-Internship Dishub</h1>
            <p className="text-sm text-surface-500">Portal Magang Dinas Perhubungan Kota Surabaya</p>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex w-full border-b border-surface-200 px-6">
            <Link 
              href="/login" 
              className={`flex-1 pb-3 pt-2 text-center transition-colors duration-200 focus:outline-none text-sm ${isLogin ? 'border-b-2 border-primary-700 text-primary-700 font-semibold' : 'border-b-2 border-transparent text-surface-500 hover:text-primary-700'}`}
            >
              Masuk
            </Link>
            <Link 
              href="/register" 
              className={`flex-1 pb-3 pt-2 text-center transition-colors duration-200 focus:outline-none text-sm ${!isLogin ? 'border-b-2 border-primary-700 text-primary-700 font-semibold' : 'border-b-2 border-transparent text-surface-500 hover:text-primary-700'}`}
            >
              Daftar
            </Link>
          </div>
          
          {/* Forms Container */}
          <div className="p-6 sm:p-8 flex-1 relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

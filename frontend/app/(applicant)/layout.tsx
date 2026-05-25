"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/ui/Topbar";
import BottomNav from "@/components/ui/BottomNav";
import ChatBubble from "@/components/ui/ChatBubble";
import api from "@/lib/axios";
import Cookies from "js-cookie";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<number>(0);

  useEffect(() => {
    // Get user ID from auth
    const fetchUserAndApp = async () => {
      try {
        const token = Cookies.get("auth_token");
        if (!token) return;

        const userRes = await api.get("/auth/me");
        if (userRes.data.success && userRes.data.data?.user) {
          setUserId(userRes.data.data.user.id);
        }
      } catch {
        // silent
      }
    };
    fetchUserAndApp();
  }, []);

  return (
    <div className="min-h-screen bg-surface-50">
      <Topbar title="E-Internship" subtitle="Dinas Perhubungan Kota Surabaya" />
      <main className="container-main py-6 pb-4">
        {children}
      </main>
      <BottomNav />
      {/* {userId > 0 && (
        <ChatBubble userId={userId} />
      )} */}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send } from "lucide-react";
import api from "@/lib/axios";
import { Card, CardHeader, CardTitle } from "@/components";

interface Message {
  id: number;
  user_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: number;
    name: string;
    role: string;
  };
}

interface AdminChatPanelProps {
  userId: number; // The applicant's user ID
  adminId: number;
}

export default function AdminChatPanel({ userId, adminId }: AdminChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/messages/${userId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch {
      // silent
    }
  }, [userId]);

  const markAsRead = useCallback(async () => {
    try {
      await api.patch(`/messages/${userId}/read`);
    } catch {
      // silent
    }
  }, [userId]);

  // Initial fetch + polling
  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
    markAsRead();
    const interval = setInterval(() => {
      fetchMessages();
      markAsRead();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/messages/${userId}`, { message: newMsg.trim() });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMsg("");
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Hari ini";
    if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = formatDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  const unreadFromApplicant = messages.filter((m) => m.sender_id !== adminId && !m.is_read).length;

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>
            <span className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-500" />
              Chat dengan Pelamar
            </span>
          </CardTitle>
          {unreadFromApplicant > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
              {unreadFromApplicant} baru
            </span>
          )}
        </div>
      </CardHeader>

      {/* Messages Area */}
      <div className="h-[320px] overflow-y-auto px-1 py-2 space-y-1 bg-surface-50/50 rounded-xl border border-surface-100 mb-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-surface-400">
            <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Belum ada pesan</p>
            <p className="text-xs mt-1">Pelamar belum mengirim pesan.</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center gap-2 my-3 px-2">
                <div className="flex-1 h-px bg-surface-200" />
                <span className="text-[10px] text-surface-400 font-medium px-2 py-0.5 bg-surface-100 rounded-full">{group.date}</span>
                <div className="flex-1 h-px bg-surface-200" />
              </div>
              {group.messages.map((msg) => {
                const isMine = msg.sender_id === adminId;
                return (
                  <div key={msg.id} className={`flex mb-2 px-3 ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                        isMine
                          ? "bg-primary-600 text-white rounded-br-md"
                          : "bg-white text-surface-800 border border-surface-200 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {!isMine && (
                        <p className="text-[10px] font-semibold mb-0.5 text-emerald-500">
                          {msg.sender.name} (Pelamar)
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-[9px] mt-1 text-right ${isMine ? "text-primary-200" : "text-surface-400"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Balas pesan pelamar..."
          maxLength={2000}
          className="flex-1 px-4 py-2.5 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-surface-400"
        />
        <button
          type="submit"
          disabled={!newMsg.trim() || sending}
          className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Kirim</span>
        </button>
      </form>
    </Card>
  );
}

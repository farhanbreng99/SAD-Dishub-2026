"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import api from "@/lib/axios";

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

interface ChatBubbleProps {
  userId: number;
}

export default function ChatBubble({ userId }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/messages/${userId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch {
      // silent
    }
  }, [userId]);

  // Fetch unread counts
  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get("/messages/unread-counts");
      if (res.data.success) {
        setUnreadCount(res.data.data.total || 0);
      }
    } catch {
      // silent
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await api.patch(`/messages/${userId}/read`);
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, [userId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Fetch messages when chat opens
  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      fetchMessages().finally(() => setLoading(false));
      markAsRead();
      const interval = setInterval(() => {
        fetchMessages();
        markAsRead();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [open, userId, fetchMessages, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !userId || sending) return;

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

  if (!userId) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Buka chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-36 right-5 z-50 w-[340px] sm:w-[380px] h-[460px] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-surface-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white text-sm font-semibold">Chat Admin</h3>
              <p className="text-primary-100 text-[11px]">Tanyakan seputar pengajuan Anda</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronDown className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-surface-50/50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-surface-400">
                <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Belum ada pesan</p>
                <p className="text-xs mt-1">Kirim pesan pertama Anda kepada Admin!</p>
              </div>
            ) : (
              groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date Separator */}
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-surface-200" />
                    <span className="text-[10px] text-surface-400 font-medium px-2 py-0.5 bg-surface-100 rounded-full">{group.date}</span>
                    <div className="flex-1 h-px bg-surface-200" />
                  </div>
                  {group.messages.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                            isMine
                              ? "bg-primary-600 text-white rounded-br-md"
                              : "bg-white text-surface-800 border border-surface-200 rounded-bl-md shadow-sm"
                          }`}
                        >
                          {!isMine && (
                            <p className={`text-[10px] font-semibold mb-0.5 ${isMine ? "text-primary-200" : "text-primary-500"}`}>
                              {msg.sender.name}
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
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-surface-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Tulis pesan..."
              maxLength={2000}
              className="flex-1 px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-surface-400"
            />
            <button
              type="submit"
              disabled={!newMsg.trim() || sending}
              className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

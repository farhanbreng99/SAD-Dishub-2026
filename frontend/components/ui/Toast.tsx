"use client";

import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Toast Helper Functions ────────────────────────

export function toastSuccess(message: string) {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-slide-in-right" : "opacity-0"
        } max-w-sm w-full bg-white shadow-modal rounded-xl pointer-events-auto border border-emerald-100 overflow-hidden`}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900">Berhasil</p>
            <p className="text-sm text-surface-500 mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="shrink-0 p-1 rounded-md hover:bg-surface-100 text-surface-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
}

export function toastError(message: string) {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-slide-in-right" : "opacity-0"
        } max-w-sm w-full bg-white shadow-modal rounded-xl pointer-events-auto border border-red-100 overflow-hidden`}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900">Gagal</p>
            <p className="text-sm text-surface-500 mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="shrink-0 p-1 rounded-md hover:bg-surface-100 text-surface-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}

export function toastWarning(message: string) {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-slide-in-right" : "opacity-0"
        } max-w-sm w-full bg-white shadow-modal rounded-xl pointer-events-auto border border-amber-100 overflow-hidden`}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900">Perhatian</p>
            <p className="text-sm text-surface-500 mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="shrink-0 p-1 rounded-md hover:bg-surface-100 text-surface-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
}

export function toastInfo(message: string) {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-slide-in-right" : "opacity-0"
        } max-w-sm w-full bg-white shadow-modal rounded-xl pointer-events-auto border border-blue-100 overflow-hidden`}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900">Informasi</p>
            <p className="text-sm text-surface-500 mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="shrink-0 p-1 rounded-md hover:bg-surface-100 text-surface-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApplicationStatus, ApplicantType, DocumentType } from "@/types";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to Indonesian locale.
 */
export function formatDate(dateStr: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "-";

  const defaults: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  };

  return new Date(dateStr).toLocaleDateString("id-ID", defaults);
}

/**
 * Format a date string with time.
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";

  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format application status to Indonesian display text.
 */
export function formatStatus(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    pending: "Menunggu",
    reviewing: "Sedang Ditinjau",
    accepted: "Diterima",
    rejected: "Ditolak",
  };
  return map[status] || status;
}

/**
 * Get status color classes for badges.
 */
export function getStatusColor(status: ApplicationStatus | "locked"): {
  bg: string;
  text: string;
  dot: string;
} {
  const colors = {
    pending: { bg: "bg-status-pending-bg", text: "text-amber-700", dot: "bg-status-pending" },
    reviewing: { bg: "bg-status-reviewing-bg", text: "text-blue-700", dot: "bg-status-reviewing" },
    accepted: { bg: "bg-status-accepted-bg", text: "text-emerald-700", dot: "bg-status-accepted" },
    rejected: { bg: "bg-status-rejected-bg", text: "text-red-700", dot: "bg-status-rejected" },
    locked: { bg: "bg-status-locked-bg", text: "text-gray-600", dot: "bg-status-locked" },
  };
  return colors[status] || colors.pending;
}

/**
 * Format applicant type to Indonesian display text.
 */
export function formatApplicantType(type: ApplicantType | null | undefined): string {
  if (!type) return "-";
  const map: Record<ApplicantType, string> = {
    slta: "SLTA/Sederajat",
    mahasiswa: "Mahasiswa",
    fresh_graduate: "Fresh Graduate",
    instansi: "Instansi/Lembaga",
  };
  return map[type] || type;
}

/**
 * Format document type to display text.
 */
export function formatDocumentType(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    cv: "Curriculum Vitae",
    cover_letter: "Surat Pengantar",
    id_card: "Kartu Identitas",
    proposal: "Proposal",
  };
  return map[type] || type;
}

/**
 * Format a number as a percentage string.
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format rule pass/fail result.
 */
export function formatRuleResult(passed: boolean | null): string {
  if (passed === null) return "Belum Diproses";
  return passed ? "Lolos ✓" : "Tidak Lolos ✗";
}

/**
 * Get the month name in Indonesian.
 */
export function getMonthName(month: number): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return months[month - 1] || "";
}

/**
 * Truncate text to a maximum length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Generate initials from a name (e.g. "Ahmad Fauzi" → "AF").
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format file size to human-readable.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

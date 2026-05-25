"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// ─── Table Types ───────────────────────────────────

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  onRowClick?: (item: T) => void;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  // Sorting
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = "Tidak ada data ditemukan.",
  emptyIcon,
  className,
  onRowClick,
  currentPage,
  totalPages,
  total,
  onPageChange,
  sortField,
  sortDirection,
  onSort,
}: TableProps<T>) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px]">
          {/* Header */}
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider",
                    col.sortable && "cursor-pointer select-none hover:text-surface-700",
                    col.headerClassName
                  )}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortField === col.key && (
                      <span className="text-primary-600">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-surface-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="skeleton h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center"
                >
                  <div className="empty-state">
                    {emptyIcon && <div className="empty-state-icon">{emptyIcon}</div>}
                    <p className="text-sm text-surface-400">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    "transition-colors",
                    onRowClick &&
                      "cursor-pointer hover:bg-primary-50/50 active:bg-primary-50"
                  )}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5 text-sm text-surface-700",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(item, index)
                        : String((item as Record<string, unknown>)[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-white">
          <p className="text-sm text-surface-500">
            Halaman {currentPage} dari {totalPages}
            {total !== undefined && (
              <span className="ml-1">({total} total)</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              aria-label="Halaman pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange((currentPage || 1) - 1)}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange((currentPage || 1) + 1)}
              disabled={currentPage === totalPages}
              aria-label="Halaman selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange(totalPages!)}
              disabled={currentPage === totalPages}
              aria-label="Halaman terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pagination Button ─────────────────────────────

function PaginationButton({
  children,
  disabled,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-md text-surface-600",
        "transition-colors duration-150",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-surface-100 hover:text-surface-800 active:bg-surface-200"
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

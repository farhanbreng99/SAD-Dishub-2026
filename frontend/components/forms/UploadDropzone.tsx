"use client";

import React, { useCallback, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";
import {
  Upload,
  FileText,
  Image,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface UploadDropzoneProps {
  label: string;
  description?: string;
  accept?: Accept;
  maxSize?: number; // in bytes
  value?: File | null;
  existingFile?: { name: string; path: string } | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function UploadDropzone({
  label,
  description,
  accept = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  },
  maxSize = 5 * 1024 * 1024, // 5MB default
  value,
  existingFile,
  onChange,
  error,
  disabled = false,
  className,
}: UploadDropzoneProps) {
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setRejectionError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorCode = rejection.errors[0]?.code;
        if (errorCode === "file-too-large") {
          setRejectionError(`Ukuran file melebihi batas ${formatFileSize(maxSize)}.`);
        } else if (errorCode === "file-invalid-type") {
          setRejectionError("Format file tidak didukung.");
        } else {
          setRejectionError("File tidak valid.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onChange(acceptedFiles[0]);
      }
    },
    [onChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  const currentFile = value;
  const hasFile = !!currentFile || !!existingFile;
  const displayError = error || rejectionError;

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setRejectionError(null);
  };

  const isImage = currentFile?.type?.startsWith("image/");

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label */}
      <label className="label-base">{label}</label>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "px-6 py-8 border-2 border-dashed rounded-xl",
          "transition-all duration-200 cursor-pointer",
          "group",
          disabled && "opacity-50 cursor-not-allowed",
          displayError
            ? "border-red-300 bg-red-50/50"
            : isDragActive
            ? "border-primary-400 bg-primary-50 scale-[1.01]"
            : hasFile
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-surface-300 bg-surface-50 hover:border-primary-300 hover:bg-primary-50/30"
        )}
      >
        <input {...getInputProps()} />

        {hasFile ? (
          // ─── File Preview ──────────────────────────
          <div className="flex items-center gap-3 w-full max-w-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              {isImage ? (
                <Image className="w-5 h-5 text-emerald-600" />
              ) : (
                <FileText className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">
                {currentFile?.name || existingFile?.name || "File"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {currentFile && (
                  <span className="text-xs text-surface-400">
                    {formatFileSize(currentFile.size)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="w-3 h-3" />
                  {currentFile ? "Siap diunggah" : "Terunggah"}
                </span>
              </div>
            </div>
            {!disabled && (
              <button
                onClick={removeFile}
                className="p-1.5 rounded-md hover:bg-red-100 text-surface-400 hover:text-red-600 transition-colors"
                aria-label="Hapus file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          // ─── Empty State ───────────────────────────
          <>
            <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
              <Upload className="w-6 h-6 text-surface-400 group-hover:text-primary-600 transition-colors" />
            </div>
            <p className="text-sm font-medium text-surface-700">
              {isDragActive ? (
                "Lepaskan file di sini..."
              ) : (
                <>
                  <span className="text-primary-600">Klik untuk pilih</span> atau
                  seret file ke sini
                </>
              )}
            </p>
            {description && (
              <p className="text-xs text-surface-400 mt-1">{description}</p>
            )}
            <p className="text-xs text-surface-400 mt-1">
              Maks. {formatFileSize(maxSize)}
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}

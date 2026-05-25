import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "E-Internship Dishub Surabaya",
    template: "%s | E-Internship Dishub",
  },
  description:
    "Portal pendaftaran dan manajemen magang Dinas Perhubungan Kota Surabaya",
  keywords: ["magang", "internship", "dishub", "surabaya", "dinas perhubungan"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "0.75rem",
              padding: "12px 16px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
            },
            success: {
              iconTheme: { primary: "#10B981", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "#ffffff" },
            },
          }}
        />
      </body>
    </html>
  );
}

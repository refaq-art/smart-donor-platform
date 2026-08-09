"use client";

import { useEffect } from "react";
import { BrandMark } from "@/components/brand-mark";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy-50 px-4 text-center">
      <BrandMark size="lg" />
      <div className="max-w-md">
        <h1 className="mb-2 text-lg font-semibold text-slate-800">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-slate-500">{error.message || "يرجى المحاولة مرة أخرى، أو التواصل مع الدعم الفني إذا استمرت المشكلة."}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => reset()} className="btn-primary">
          إعادة المحاولة
        </button>
        <a href="/" className="btn-ghost">
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}

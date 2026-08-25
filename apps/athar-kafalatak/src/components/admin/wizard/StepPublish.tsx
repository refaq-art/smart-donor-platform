"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Eye, Download, Loader2 } from "lucide-react";
import type { WizardState } from "@/lib/wizard-types";
import { publishReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";

export function StepPublish({ state }: { state: WizardState }) {
  const router = useRouter();
  const [status, setStatus] = useState<"ready" | "sent">("sent");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reportUrl = token ? `${window.location.origin}/report/${token}` : "";

  const handlePublish = async () => {
    setPending(true);
    setError(null);
    const result = await publishReport({ ...state, status });
    setPending(false);
    if (!result.ok || !result.token) {
      setError(result.error ?? "حدث خطأ غير متوقع.");
      return;
    }
    setToken(result.token);
    router.refresh();
  };

  if (token) {
    return (
      <div className="rounded-xl2 border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
        <h3 className="mb-1 text-lg font-bold text-forest-900">تم نشر التقرير بنجاح</h3>
        <p className="mb-5 text-sm text-forest-500">شارك هذا الرابط الخاص مع الكافل.</p>
        <div className="mx-auto mb-5 flex max-w-md items-center gap-2 rounded-xl2 border border-forest-200 bg-white px-4 py-2.5" dir="ltr">
          <span className="flex-1 truncate text-sm text-forest-700">{reportUrl}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(reportUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            <Copy className="h-4 w-4" />
            {copied ? "تم النسخ" : "نسخ الرابط"}
          </Button>
          <a href={reportUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Eye className="h-4 w-4" />
              معاينة
            </Button>
          </a>
          <a href={`${reportUrl}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="gold">
              <Download className="h-4 w-4" />
              تحميل PDF
            </Button>
          </a>
          <Button variant="ghost" onClick={() => router.push("/admin/reports")}>
            الذهاب لقائمة التقارير
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <h3 className="mb-2 text-lg font-bold text-forest-900">جاهز للنشر</h3>
      <p className="mb-6 text-sm text-forest-500">
        سيتم توليد رابط خاص وآمن لهذا التقرير عند النشر.
      </p>

      <div className="mb-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setStatus("sent")}
          className={`rounded-xl2 border-2 px-4 py-2 text-sm font-bold ${
            status === "sent" ? "border-forest bg-forest-50 text-forest-800" : "border-forest-100 text-forest-400"
          }`}
        >
          نشر وتحديد كـ «تم الإرسال»
        </button>
        <button
          type="button"
          onClick={() => setStatus("ready")}
          className={`rounded-xl2 border-2 px-4 py-2 text-sm font-bold ${
            status === "ready" ? "border-forest bg-forest-50 text-forest-800" : "border-forest-100 text-forest-400"
          }`}
        >
          نشر كـ «جاهز» فقط
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <Button size="lg" variant="gold" onClick={handlePublish} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        نشر التقرير
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";

export function EvidenceUploadForm({
  action,
  hiddenFields,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
        const linkUrl = (form.elements.namedItem("linkUrl") as HTMLInputElement | null)?.value.trim();
        if (!file && !linkUrl) {
          e.preventDefault();
          setError("يرجى إرفاق ملف أو إدخال رابط قبل الرفع");
          return;
        }
        setError(null);
      }}
      className="flex flex-wrap items-center gap-2"
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="file" name="file" className="text-xs" onChange={() => setError(null)} />
      <span className="text-xs text-slate-400">أو</span>
      <input
        type="url"
        name="linkUrl"
        placeholder="رابط..."
        className="input w-40 text-xs"
        dir="ltr"
        onChange={() => setError(null)}
      />
      <button type="submit" className="btn-secondary py-1 text-xs">
        رفع شاهد
      </button>
      {error && <p className="w-full text-xs text-red-500">{error}</p>}
    </form>
  );
}

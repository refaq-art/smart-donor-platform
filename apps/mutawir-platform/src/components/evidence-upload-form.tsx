"use client";

import { useState } from "react";

export function EvidenceUploadForm({
  action,
  hiddenFields,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
}) {
  const [hasFile, setHasFile] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const canSubmit = hasFile || linkValue.trim().length > 0;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!canSubmit) {
          // Defensive guard in case the button is somehow triggered while
          // still disabled (e.g. Enter key before state settles).
          e.preventDefault();
        }
      }}
      className="flex flex-wrap items-center gap-2"
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input
        type="file"
        name="file"
        className="text-xs"
        onChange={(e) => setHasFile(!!e.currentTarget.files?.length)}
      />
      <span className="text-xs text-slate-400">أو</span>
      <input
        type="url"
        name="linkUrl"
        placeholder="رابط..."
        className="input w-40 text-xs"
        dir="ltr"
        value={linkValue}
        onChange={(e) => setLinkValue(e.currentTarget.value)}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-secondary py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        title={canSubmit ? undefined : "اختر ملفًا أو اكتب رابطًا أولًا"}
      >
        رفع شاهد
      </button>
    </form>
  );
}

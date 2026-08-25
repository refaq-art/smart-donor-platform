"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label="نسخ الرابط"
      onClick={async () => {
        const url = `${window.location.origin}/report/${token}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("انسخ الرابط:", url);
        }
      }}
      className="rounded-lg p-2 text-forest-500 hover:bg-forest-50"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}

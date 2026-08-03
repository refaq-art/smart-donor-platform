"use client";

import { Plus, Trash2 } from "lucide-react";

export default function DynamicKvField<T extends Record<string, string>>({
  label,
  hint,
  items,
  onChange,
  keys,
  hiddenName,
  aiSlot,
}: {
  label: string;
  hint?: string;
  items: T[];
  onChange: (items: T[]) => void;
  keys: { name: keyof T; placeholder: string; type?: "text" | "number" }[];
  hiddenName: string;
  aiSlot?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label className="field-label !mb-0">{label}</label>
        {aiSlot}
      </div>
      <input type="hidden" name={hiddenName} value={JSON.stringify(items)} readOnly />
      <div className="space-y-2">
        {items.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {keys.map((k) => (
              <input
                key={String(k.name)}
                className="input"
                type={k.type || "text"}
                placeholder={k.placeholder}
                value={row[k.name] ?? ""}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], [k.name]: e.target.value } as T;
                  onChange(next);
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50"
              aria-label="حذف"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...items, Object.fromEntries(keys.map((k) => [k.name, ""])) as T])
        }
        className="btn-ghost mt-2 border border-dashed border-brand-200 px-3 py-1.5 text-xs"
      >
        <Plus size={14} /> إضافة صف
      </button>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

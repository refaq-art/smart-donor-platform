"use client";

import { Plus, Trash2 } from "lucide-react";

export default function DynamicListField({
  label,
  hint,
  items,
  onChange,
  placeholder,
  hiddenName,
  aiSlot,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
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
        {items.map((val, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-600">
              {idx + 1}
            </span>
            <input
              className="input"
              value={val}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[idx] = e.target.value;
                onChange(next);
              }}
            />
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
        onClick={() => onChange([...items, ""])}
        className="btn-ghost mt-2 border border-dashed border-brand-200 px-3 py-1.5 text-xs"
      >
        <Plus size={14} /> إضافة عنصر
      </button>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "./ui";

/** زر حذف لا ينفّذ الحذف مباشرةً — يفتح نافذة تأكيد إلزامية أولًا، تمامًا كما
 * تطلب المتطلبات لكل عمليات الحذف (عميل / عملية / قسط / دفعة / مستخدم). */
export function ConfirmDeleteButton({
  onConfirm,
  title = "تأكيد الحذف",
  description = "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
  label = "حذف",
  compact = false,
}: {
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        variant="danger"
        className={compact ? "px-3 py-2 text-xs" : undefined}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} />
        {label}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-black text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                تراجع
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await onConfirm();
                    setOpen(false);
                  });
                }}
              >
                {isPending ? "جارٍ الحذف..." : "نعم، احذف"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

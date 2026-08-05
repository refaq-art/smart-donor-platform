"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import type { DocState } from "@/app/actions/organization";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { documentValidity } from "@/lib/document-validity";
import ConfirmSubmitButton from "./confirm-submit-button";
import { FolderOpen, Trash2, UploadCloud, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Doc = {
  id: string;
  title: string;
  category: string;
  filename: string;
  url: string;
  issueDate: Date | string | null;
  expiryDate: Date | string | null;
  notes: string | null;
};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-secondary text-xs" disabled={pending}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
      رفع المستند
    </button>
  );
}

export default function DocumentLibrary({
  documents,
  uploadAction,
  deleteAction,
  editable,
}: {
  documents: Doc[];
  uploadAction: (prev: DocState, formData: FormData) => Promise<DocState>;
  deleteAction: (id: string) => Promise<void>;
  editable: boolean;
}) {
  const [state, formAction] = useFormState<DocState, FormData>(uploadAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  const expiringSoon = documents.filter((d) => {
    const v = documentValidity(d.expiryDate);
    return v.tone === "warn" || v.tone === "danger";
  });

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-brand-700">
          <FolderOpen size={16} /> مكتبة المستندات
        </p>
        <span className="text-xs text-slate-400">{documents.length} مستندًا</span>
      </div>

      <p className="text-xs text-slate-500">
        ارفع مستندات الجمعية مرة واحدة هنا لإعادة استخدامها في أي طلب منحة، مع تنبيه قبل انتهاء
        صلاحيتها.
      </p>

      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>
            {expiringSoon.length} مستند يحتاج انتباهك (منتهي الصلاحية أو يقترب من الانتهاء):{" "}
            {expiringSoon.map((d) => d.title).join("، ")}
          </p>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-xs text-slate-400">لا توجد مستندات بعد.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-2.5 text-right">المستند</th>
                <th className="p-2.5 text-right">التصنيف</th>
                <th className="p-2.5 text-right">الإصدار</th>
                <th className="p-2.5 text-right">الانتهاء</th>
                <th className="p-2.5 text-right">الحالة</th>
                {editable && <th className="p-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => {
                const v = documentValidity(d.expiryDate);
                return (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="p-2.5">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-brand-700 hover:underline"
                      >
                        {d.title}
                      </a>
                    </td>
                    <td className="p-2.5 text-xs text-slate-500">{d.category}</td>
                    <td className="p-2.5 text-xs text-slate-500">{formatDate(d.issueDate)}</td>
                    <td className="p-2.5 text-xs text-slate-500">{formatDate(d.expiryDate)}</td>
                    <td className="p-2.5">
                      <span
                        className={cn(
                          "badge",
                          v.tone === "danger" && "border-red-300 bg-red-50 text-red-700",
                          v.tone === "warn" && "border-amber-300 bg-amber-50 text-amber-700",
                          v.tone === "ok" && "border-emerald-300 bg-emerald-50 text-emerald-700",
                          v.tone === "neutral" && "border-slate-300 bg-slate-100 text-slate-600"
                        )}
                      >
                        {v.label}
                      </span>
                    </td>
                    {editable && (
                      <td className="p-2.5">
                        <form action={deleteAction.bind(null, d.id)}>
                          <ConfirmSubmitButton
                            confirmMessage={`حذف المستند "${d.title}"؟`}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={15} />
                          </ConfirmSubmitButton>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editable && (
        <form ref={formRef} action={formAction} className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <input className="input" name="title" placeholder="عنوان المستند *" required />
          <select className="select" name="category" required defaultValue="">
            <option value="" disabled>
              التصنيف *
            </option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div>
            <label className="field-label text-xs">تاريخ الإصدار</label>
            <input className="input" type="date" name="issueDate" />
          </div>
          <div>
            <label className="field-label text-xs">تاريخ الانتهاء</label>
            <input className="input" type="date" name="expiryDate" />
          </div>
          <input className="input sm:col-span-2" name="notes" placeholder="ملاحظات (اختياري)" />
          <input
            type="file"
            name="file"
            required
            className="sm:col-span-2 text-xs file:me-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-brand-700"
          />
          <div className="sm:col-span-2">
            <UploadButton />
          </div>
          {state?.error && (
            <p className="sm:col-span-2 text-xs font-bold text-red-600">{state.error}</p>
          )}
          {state?.success && (
            <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 size={14} /> تم رفع المستند
            </p>
          )}
        </form>
      )}
    </div>
  );
}

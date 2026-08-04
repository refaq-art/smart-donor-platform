"use client";

import { useFormState, useFormStatus } from "react-dom";
import { deleteAttachmentAction, type UploadFormState } from "@/app/actions/attachments";
import { Paperclip, Trash2, Loader2, UploadCloud } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Attachment = {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedAt: Date | string;
};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-secondary text-xs" disabled={pending}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
      رفع الملف
    </button>
  );
}

export default function AttachmentsPanel({
  attachments,
  uploadAction,
  revalidateTarget,
  canEdit,
}: {
  attachments: Attachment[];
  uploadAction: (prev: UploadFormState, formData: FormData) => Promise<UploadFormState>;
  revalidateTarget: string;
  canEdit: boolean;
}) {
  const [state, formAction] = useFormState<UploadFormState, FormData>(uploadAction, null);

  return (
    <div className="card p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
        <Paperclip size={16} /> المرفقات
      </p>

      {attachments.length === 0 ? (
        <p className="mb-3 text-xs text-slate-400">لا توجد مرفقات بعد.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"
            >
              <a href={a.url} target="_blank" rel="noreferrer" className="truncate font-bold text-brand-700 hover:underline">
                {a.filename}
              </a>
              <div className="flex shrink-0 items-center gap-2 text-slate-400">
                <span>{(a.size / 1024).toFixed(0)} كيلوبايت</span>
                <span className="hidden sm:inline">{formatDate(a.uploadedAt)}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => deleteAttachmentAction(a.id, revalidateTarget)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="حذف المرفق"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            name="file"
            required
            className="max-w-[220px] flex-1 text-xs file:me-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-brand-700"
          />
          <UploadButton />
        </form>
      )}
      {state?.error && <p className="mt-2 text-xs font-bold text-red-600">{state.error}</p>}
      <p className="field-hint">PDF, Word, Excel أو صور — بحد أقصى 10 ميجابايت.</p>
    </div>
  );
}

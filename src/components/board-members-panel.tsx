"use client";

import { useRef } from "react";
import { Users, Trash2, Plus } from "lucide-react";
import ConfirmSubmitButton from "./confirm-submit-button";

type Member = {
  id: string;
  name: string;
  position: string | null;
  memberType: string;
  phone: string | null;
  email: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  BOARD: "مجلس الإدارة",
  EXECUTIVE: "الفريق التنفيذي",
};

export default function BoardMembersPanel({
  members,
  addAction,
  deleteAction,
  editable,
}: {
  members: Member[];
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  editable: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const groups = [
    { key: "BOARD", items: members.filter((m) => m.memberType === "BOARD") },
    { key: "EXECUTIVE", items: members.filter((m) => m.memberType === "EXECUTIVE") },
  ];

  return (
    <div className="card space-y-4 p-5">
      <p className="flex items-center gap-2 text-sm font-black text-brand-700">
        <Users size={16} /> مجلس الإدارة والفريق التنفيذي
      </p>

      {members.length === 0 ? (
        <p className="text-xs text-slate-400">لم يُضف أعضاء بعد.</p>
      ) : (
        groups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.key}>
                <p className="mb-1.5 text-xs font-bold text-slate-500">{TYPE_LABELS[g.key]}</p>
                <ul className="space-y-1.5">
                  {g.items.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{m.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[m.position, m.phone, m.email].filter(Boolean).join(" — ") || "—"}
                        </p>
                      </div>
                      {editable && (
                        <form action={deleteAction.bind(null, m.id)}>
                          <ConfirmSubmitButton
                            confirmMessage={`حذف ${m.name}؟`}
                            className="shrink-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={15} />
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
        )
      )}

      {editable && (
        <form
          ref={formRef}
          action={async (fd) => {
            await addAction(fd);
            formRef.current?.reset();
          }}
          className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2"
        >
          <input className="input" name="name" placeholder="الاسم" required />
          <input className="input" name="position" placeholder="المنصب" />
          <select className="select" name="memberType" defaultValue="BOARD">
            <option value="BOARD">مجلس الإدارة</option>
            <option value="EXECUTIVE">الفريق التنفيذي</option>
          </select>
          <input className="input" name="phone" placeholder="الهاتف" dir="ltr" />
          <input className="input sm:col-span-2" name="email" type="email" placeholder="البريد الإلكتروني" dir="ltr" />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-secondary text-xs">
              <Plus size={14} /> إضافة عضو
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

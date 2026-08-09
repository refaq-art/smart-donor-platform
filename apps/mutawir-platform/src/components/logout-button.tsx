"use client";

import { logoutAction } from "@/app/actions/auth-actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50">
        تسجيل الخروج
      </button>
    </form>
  );
}

"use client";

import { useTransition } from "react";
import { adminToggleUserActiveAction } from "@/app/actions/lm/admin";
import { Button } from "./ui";

export function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "primary"}
      className="px-3 py-2 text-xs"
      disabled={isPending}
      onClick={() => startTransition(() => adminToggleUserActiveAction(userId, !isActive))}
    >
      {isPending ? "جارٍ التنفيذ..." : isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
    </Button>
  );
}

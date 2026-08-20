"use client";

import type { ReactNode } from "react";

/** يغلّف أي form action حسّاس (حذف مثلًا) بتأكيد المتصفح قبل التنفيذ. */
export function ConfirmForm({
  action,
  confirmMessage,
  children,
  className,
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}

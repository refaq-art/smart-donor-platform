"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  return (
    <form
      action={async () => {
        if (window.confirm(confirmMessage)) {
          await action();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        aria-label="حذف"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}

"use client";

export function ConfirmSubmitButton({
  action,
  confirmMessage,
  children,
  className,
}: {
  action: () => Promise<unknown>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={async () => {
        if (window.confirm(confirmMessage)) {
          await action();
        }
      }}
    >
      <button type="submit" className={className ?? "btn-primary"}>
        {children}
      </button>
    </form>
  );
}

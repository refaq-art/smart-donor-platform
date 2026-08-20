import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("badge", className)}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function FormMessage({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  if (!message) return null;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "mb-4 rounded-xl border px-4 py-3 text-sm font-bold",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {message}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-1.5 text-sm font-bold text-brand-600">{eyebrow}</p>}
        <h2 className="text-2xl font-black text-ink sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <nav aria-label="ترقيم الصفحات" className="mt-10 flex items-center justify-center gap-1.5">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={cn(
          "btn-secondary h-9 w-9 !p-0",
          currentPage === 1 && "pointer-events-none opacity-40"
        )}
      >
        ‹
      </Link>
      {pages.map((page, idx) => {
        const prev = pages[idx - 1];
        const showEllipsis = prev !== undefined && page - prev > 1;
        return (
          <span key={page} className="flex items-center gap-1.5">
            {showEllipsis && <span className="px-1 text-slate-400">…</span>}
            <Link
              href={buildHref(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition",
                page === currentPage
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {page}
            </Link>
          </span>
        );
      })}
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={cn(
          "btn-secondary h-9 w-9 !p-0",
          currentPage === totalPages && "pointer-events-none opacity-40"
        )}
      >
        ›
      </Link>
    </nav>
  );
}

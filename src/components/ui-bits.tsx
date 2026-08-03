import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
  return (
    <span className={cn("badge", colorClass || "bg-slate-100 text-slate-700 border-slate-300")}>
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <Icon size={26} />
        </div>
      )}
      <p className="text-base font-bold text-ink">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "brand" | "gold" | "red" | "blue";
}) {
  const toneClasses: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    gold: "bg-gold-50 text-gold-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", toneClasses[tone])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams || {}).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        className={cn("btn-secondary px-3 py-1.5 text-xs", page <= 1 && "pointer-events-none opacity-40")}
      >
        السابق
      </Link>
      <span className="text-xs font-bold text-slate-500">
        صفحة {page} من {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        className={cn(
          "btn-secondary px-3 py-1.5 text-xs",
          page >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        التالي
      </Link>
    </div>
  );
}

export function ProgressBar({ percent, tone = "brand" }: { percent: number; tone?: "brand" | "gold" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full", tone === "brand" ? "bg-brand-500" : "bg-gold-400")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

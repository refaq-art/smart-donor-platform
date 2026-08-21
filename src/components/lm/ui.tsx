import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { STATUS_META, type LmStatus } from "@/lib/lm/status";

// ملاحظة: هذا الملف بلا "use client" عمدًا — كل مكوّناته عرض بحت بلا Hooks،
// لذا يمكن استيرادها من مكوّنات خادم مباشرة (تمرير Icon كخاصية مثلًا يفشل عبر
// حدود الخادم/العميل لو كان هذا الملف عميلًا). المكوّن الوحيد الذي يحتاج تفاعل
// عميل فعلي (useFormStatus) منقول إلى submit-button.tsx المنفصل.

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const variants: Record<string, string> = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };
  return <button className={cn(buttonBase, variants[variant], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const variants: Record<string, string> = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };
  return (
    <Link href={href} className={cn(buttonBase, variants[variant], className)}>
      {children}
    </Link>
  );
}


export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600">{message}</p>;
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-slate-700">
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}

export function StatusBadge({ status }: { status: LmStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        meta.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 whitespace-nowrap">
      {type === "GRACE" ? "مهلة" : "أقساط"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "emerald",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "emerald" | "red" | "amber" | "slate" | "blue";
}) {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", toneClasses[tone])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
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
    <Card className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon size={26} />
        </div>
      )}
      <p className="text-base font-bold text-slate-900">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action}
    </Card>
  );
}

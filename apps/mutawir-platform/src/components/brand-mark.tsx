export function BrandMark({ withTagline = false, size = "md" }: { withTagline?: boolean; size?: "sm" | "md" | "lg" }) {
  const textSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size === "lg" ? 44 : 32} height={size === "lg" ? 44 : 32} viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="10" fill="#161d3e" />
        <path d="M9 28V12l7 9 7-9v16" stroke="#e2b04a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="31" cy="12" r="2.4" fill="#e2b04a" />
      </svg>
      <div className="leading-tight">
        <div className={`font-bold text-navy-900 ${textSize}`}>مُطوّر</div>
        {withTagline && <div className="text-xs font-medium text-slate-500">من القياس إلى الأثر</div>}
      </div>
    </div>
  );
}

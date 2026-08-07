import Image from "next/image";

// Compact lockup: the icon crop from the real platform logo + crisp HTML
// wordmark, used at small sizes (sidebar, header) where the baked-in text
// inside the logo image would blur. See BrandLockup for the full artwork.
export function BrandMark({ withTagline = false, size = "md" }: { withTagline?: boolean; size?: "sm" | "md" | "lg" }) {
  const textSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  const iconSize = size === "lg" ? 44 : size === "sm" ? 24 : 32;
  return (
    <div className="flex items-center gap-2.5 select-none">
      <Image src="/brand/logo-icon.png" alt="مُطوّر" width={iconSize} height={iconSize} className="shrink-0" priority />
      <div className="leading-tight">
        <div className={`font-bold text-navy-900 ${textSize}`}>مُطوّر</div>
        {withTagline && <div className="text-xs font-medium text-slate-500">من القياس إلى الأثر</div>}
      </div>
    </div>
  );
}

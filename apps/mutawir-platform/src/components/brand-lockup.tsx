import Image from "next/image";

// Full platform logo artwork (icon + wordmark + the identity's own subtitle),
// used where the mark should stand on its own — e.g. the login screen.
export function BrandLockup({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <div className="flex flex-col items-center select-none">
      <Image src="/brand/logo-full.png" alt="مُطوّر" width={220} height={313} priority className="h-auto w-40 sm:w-48" />
      {withTagline && <div className="-mt-2 text-sm font-medium text-navy-600">من القياس إلى الأثر</div>}
    </div>
  );
}

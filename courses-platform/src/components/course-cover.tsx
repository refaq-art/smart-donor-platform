import { COVER_COLOR_GRADIENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** غلاف افتراضي متدرّج الألوان بأحرف عنوان الدورة عند غياب صورة حقيقية. */
export function CourseCover({
  title,
  imageUrl,
  color,
  className,
}: {
  title: string;
  imageUrl?: string | null;
  color: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // نستخدم <img> عاديًا بدل next/image لأن الرابط يُدخله المسؤول يدويًا من أي
      // نطاق خارجي، ولا يمكن ضبط remotePatterns مسبقًا لنطاقات غير معروفة.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  const initials = title.trim().slice(0, 2);
  const gradient = COVER_COLOR_GRADIENTS[color] ?? COVER_COLOR_GRADIENTS.blue;

  return (
    <div
      role="img"
      aria-label={title}
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br text-4xl font-black text-white/90",
        gradient,
        className
      )}
    >
      {initials}
    </div>
  );
}

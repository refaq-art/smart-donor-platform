import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_MB } from "./constants";

export type UploadOutcome =
  | { ok: true; storedName: string; url: string; filename: string; mimeType: string; size: number }
  | { ok: false; error: string };

// عند التشغيل المحلي: تُحفظ المرفقات في public/uploads كملفات عادية على القرص.
// عند النشر على استضافة بدون قرص دائم (مثل Vercel): يُضبط BLOB_READ_WRITE_TOKEN
// لتخزين المرفقات في Vercel Blob (تخزين ملفات مجاني ضمن الخطة المجانية)، دون أي
// تغيير في بقية الكود. راجع قسم "النشر السحابي المجاني" في README.md للتفاصيل.
export async function saveUploadedFile(file: File): Promise<UploadOutcome> {
  if (!file || file.size === 0) {
    return { ok: false, error: "لم يتم اختيار ملف" };
  }

  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return { ok: false, error: `حجم الملف يتجاوز الحد المسموح (${MAX_UPLOAD_MB} ميجابايت)` };
  }

  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  if (!ext) {
    return { ok: false, error: "نوع الملف غير مدعوم. الأنواع المسموحة: PDF, Word, Excel, صور" };
  }

  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${storedName}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return {
      ok: true,
      storedName,
      url: blob.url,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, storedName);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  return {
    ok: true,
    storedName,
    url: `/uploads/${storedName}`,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteUploadedFile(storedName: string, url: string): Promise<void> {
  if (url.startsWith("http")) {
    await del(url).catch(() => {});
    return;
  }
  const { unlink } = await import("fs/promises");
  await unlink(path.join(process.cwd(), "public", "uploads", storedName)).catch(() => {});
}

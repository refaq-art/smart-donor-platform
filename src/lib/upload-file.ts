import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_MB } from "./constants";

export type UploadOutcome =
  | { ok: true; storedName: string; url: string; filename: string; mimeType: string; size: number }
  | { ok: false; error: string };

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

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
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

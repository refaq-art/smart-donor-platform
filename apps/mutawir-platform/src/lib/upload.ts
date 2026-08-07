import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

export async function saveUploadedFile(file: File): Promise<{ fileName: string; fileUrl: string; fileType: string }> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("نوع الملف غير مدعوم. الأنواع المسموحة: PDF, Word, Excel, صور");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("حجم الملف يتجاوز الحد المسموح (15 ميغابايت)");
  }

  await mkdir(UPLOAD_ROOT, { recursive: true });
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_ROOT, storedName), buffer);

  return {
    fileName: file.name,
    fileUrl: `/uploads/${storedName}`,
    fileType: file.type || ext.replace(".", ""),
  };
}

import path from "path";

// Serverless hosts (Vercel functions) have a read-only, ephemeral filesystem,
// so uploaded evidence is stored as a base64 data: URI directly in the
// AssessmentEvidence/TaskEvidence `fileUrl` column instead of on disk. This
// keeps uploads working identically in every environment with zero external
// dependencies; the tradeoff is DB row size, which is fine at MVP scale.
// Move to real object storage (R2/S3) before scaling beyond a handful of
// organizations.

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

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function saveUploadedFile(file: File): Promise<{ fileName: string; fileUrl: string; fileType: string }> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("نوع الملف غير مدعوم. الأنواع المسموحة: PDF, Word, Excel, صور");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("حجم الملف يتجاوز الحد المسموح (8 ميغابايت)");
  }

  const fileType = file.type || MIME_BY_EXT[ext] || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = `data:${fileType};base64,${buffer.toString("base64")}`;

  return { fileName: file.name, fileUrl, fileType };
}

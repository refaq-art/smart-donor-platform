export const APPLICATION_STATUSES = [
  "مسودة",
  "تحت المراجعة الداخلية",
  "جاهز للإرسال",
  "تم الإرسال",
  "مطلوب استكمال",
  "مقبول",
  "مرفوض",
  "مؤجل",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_COLORS: Record<string, string> = {
  "مسودة": "bg-slate-100 text-slate-700 border-slate-300",
  "تحت المراجعة الداخلية": "bg-amber-50 text-amber-700 border-amber-300",
  "جاهز للإرسال": "bg-blue-50 text-blue-700 border-blue-300",
  "تم الإرسال": "bg-indigo-50 text-indigo-700 border-indigo-300",
  "مطلوب استكمال": "bg-orange-50 text-orange-700 border-orange-300",
  "مقبول": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "مرفوض": "bg-red-50 text-red-700 border-red-300",
  "مؤجل": "bg-purple-50 text-purple-700 border-purple-300",
};

export const OPPORTUNITY_STATUSES = ["مفتوحة", "تحت المتابعة", "مغلقة"] as const;

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  "مفتوحة": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "تحت المتابعة": "bg-amber-50 text-amber-700 border-amber-300",
  "مغلقة": "bg-red-50 text-red-700 border-red-300",
};

export const PROJECT_STATUSES = ["مسودة", "نشط", "مؤرشف"] as const;

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  "مسودة": "bg-slate-100 text-slate-700 border-slate-300",
  "نشط": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "مؤرشف": "bg-slate-100 text-slate-500 border-slate-300",
};

export const DONOR_RELATIONSHIP_STATUSES = ["محتمل", "نشط", "متوقف"] as const;

export const DONOR_TYPES = ["مؤسسة مانحة", "شركة", "جهة حكومية", "فرد", "منظمة دولية"] as const;

export const PROJECT_CATEGORIES = [
  "تعليمي",
  "صحي",
  "إغاثي",
  "تنموي",
  "اجتماعي",
  "ثقافي",
  "بيئي",
  "تقني",
  "اقتصادي",
];

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 10);

export const DOCUMENT_CATEGORIES = [
  "ترخيص الجمعية",
  "شهادة الزكاة والدخل",
  "القوائم المالية",
  "الميزانية السنوية",
  "الخطة الاستراتيجية",
  "الخطة التشغيلية",
  "التقرير السنوي",
  "شهادة الحوكمة",
  "محضر مجلس إدارة",
  "الهيكل التنظيمي",
  "دراسة جدوى",
  "خطة قياس الأثر",
  "تقرير دعم سابق",
  "أخرى",
] as const;

import { ROLES } from "./roles-constants";

/**
 * مصفوفة الصلاحيات — مرجع واحد لمن يستطيع فعل ماذا.
 *
 * هذا الملف بيانات صرفة بلا أي استيراد من الخادم، ليكون قابلًا للاستخدام في
 * مكونات الواجهة (لإظهار/إخفاء العناصر) وفي الخادم (للإنفاذ الفعلي) معًا.
 * الإنفاذ الحقيقي يحدث دائمًا في الخادم عبر src/lib/authz.ts.
 */
export const CAN = {
  /** إنشاء/تعديل المشاريع والفرص والجهات المانحة والطلبات */
  editRecords: [ROLES.ADMIN, ROLES.ORG_MANAGER, ROLES.GRANTS_OFFICER],
  /** حذف السجلات */
  deleteRecords: [ROLES.ADMIN, ROLES.ORG_MANAGER],
  /** إدارة المستخدمين والأدوار */
  manageUsers: [ROLES.ADMIN],
  /** تعديل ملف الجمعية ومستنداتها */
  manageOrgProfile: [ROLES.ADMIN, ROLES.ORG_MANAGER],
  /** كتابة تعليقات المراجعة وطلبات التعديل */
  review: [ROLES.ADMIN, ROLES.ORG_MANAGER, ROLES.REVIEWER, ROLES.FINANCE_REVIEWER],
  /** المراجعة المالية تحديدًا (الميزانية) */
  financeReview: [ROLES.ADMIN, ROLES.ORG_MANAGER, ROLES.FINANCE_REVIEWER],
  /** الاعتماد النهائي وتحويل الطلب إلى "جاهز للإرسال"/"تم الإرسال" */
  finalApproval: [ROLES.ADMIN, ROLES.ORG_MANAGER],
  /** تغيير حالة الطلب ضمن مسار المراجعة */
  changeStatus: [
    ROLES.ADMIN,
    ROLES.ORG_MANAGER,
    ROLES.GRANTS_OFFICER,
    ROLES.REVIEWER,
    ROLES.FINANCE_REVIEWER,
  ],
  /** ضبط قواعد الأهلية للفرص */
  manageEligibility: [ROLES.ADMIN, ROLES.ORG_MANAGER, ROLES.GRANTS_OFFICER],
} as const;

export type Permission = keyof typeof CAN;

export function roleHasPermission(role: string | undefined | null, permission: Permission) {
  if (!role) return false;
  return (CAN[permission] as readonly string[]).includes(role);
}

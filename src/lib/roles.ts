export const ROLES = {
  ADMIN: "ADMIN",
  ORG_MANAGER: "ORG_MANAGER",
  GRANTS_OFFICER: "GRANTS_OFFICER",
  REVIEWER: "REVIEWER",
} as const;

export type RoleKey = keyof typeof ROLES;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  ORG_MANAGER: "مدير الجمعية",
  GRANTS_OFFICER: "مسؤول المنح",
  REVIEWER: "مراجع",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "صلاحية كاملة على النظام وإدارة المستخدمين والإعدادات",
  ORG_MANAGER: "إشراف عام على المشاريع والطلبات والتقارير",
  GRANTS_OFFICER: "إعداد المشاريع وطلبات المنح ومتابعتها يوميًا",
  REVIEWER: "مراجعة الطلبات وإبداء الملاحظات دون تعديل مباشر",
};

// من يستطيع إنشاء/تعديل السجلات (مشاريع، فرص، جهات مانحة، طلبات)
export function canEdit(role?: string | null) {
  return role === ROLES.ADMIN || role === ROLES.ORG_MANAGER || role === ROLES.GRANTS_OFFICER;
}

// من يستطيع تغيير حالة الطلب (يشمل المراجع لإرجاع الطلب أو اعتماده)
export function canChangeStatus(role?: string | null) {
  return (
    role === ROLES.ADMIN ||
    role === ROLES.ORG_MANAGER ||
    role === ROLES.GRANTS_OFFICER ||
    role === ROLES.REVIEWER
  );
}

// من يستطيع إدارة المستخدمين
export function canManageUsers(role?: string | null) {
  return role === ROLES.ADMIN;
}

// من يستطيع حذف السجلات
export function canDelete(role?: string | null) {
  return role === ROLES.ADMIN || role === ROLES.ORG_MANAGER;
}

export const ROLES = {
  ADMIN: "ADMIN",
  ORG_MANAGER: "ORG_MANAGER",
  GRANTS_OFFICER: "GRANTS_OFFICER",
  REVIEWER: "REVIEWER",
  FINANCE_REVIEWER: "FINANCE_REVIEWER",
} as const;

export type RoleKey = keyof typeof ROLES;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  ORG_MANAGER: "مدير الجمعية",
  GRANTS_OFFICER: "مسؤول المنح",
  REVIEWER: "مراجع",
  FINANCE_REVIEWER: "مراجع مالي",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "صلاحية كاملة داخل الجمعية، وإدارة المستخدمين والإعدادات",
  ORG_MANAGER: "إشراف عام على المشاريع والطلبات والاعتماد النهائي",
  GRANTS_OFFICER: "إعداد المشاريع وطلبات المنح ومتابعتها يوميًا",
  REVIEWER: "مراجعة المحتوى الفني للطلبات وإبداء الملاحظات دون تعديل مباشر",
  FINANCE_REVIEWER: "مراجعة الميزانيات والجوانب المالية للطلبات",
};

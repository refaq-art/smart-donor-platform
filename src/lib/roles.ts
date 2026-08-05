// إعادة تصدير الثوابت + أغلفة رقيقة لفحص الصلاحيات في الواجهة.
// الإنفاذ الحقيقي يحدث دائمًا في الخادم عبر src/lib/authz.ts.
export { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type RoleKey } from "./roles-constants";
import { roleHasPermission } from "./authz-matrix";

export const canEdit = (role?: string | null) => roleHasPermission(role, "editRecords");
export const canChangeStatus = (role?: string | null) => roleHasPermission(role, "changeStatus");
export const canManageUsers = (role?: string | null) => roleHasPermission(role, "manageUsers");
export const canDelete = (role?: string | null) => roleHasPermission(role, "deleteRecords");
export const canManageOrgProfile = (role?: string | null) => roleHasPermission(role, "manageOrgProfile");
export const canReview = (role?: string | null) => roleHasPermission(role, "review");
export const canFinalApprove = (role?: string | null) => roleHasPermission(role, "finalApproval");
export const canManageEligibility = (role?: string | null) => roleHasPermission(role, "manageEligibility");
export const canComment = (role?: string | null) => roleHasPermission(role, "comment");

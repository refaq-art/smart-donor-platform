import {
  LayoutDashboard,
  FolderKanban,
  Target,
  HandCoins,
  FileText,
  BarChart3,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/projects", label: "المشاريع", icon: FolderKanban },
  { href: "/opportunities", label: "فرص التمويل", icon: Target },
  { href: "/donors", label: "الجهات المانحة", icon: HandCoins },
  { href: "/applications", label: "طلبات المنح", icon: FileText },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings/organization", label: "ملف الجمعية", icon: Building2 },
  { href: "/settings/users", label: "المستخدمون", icon: Users, adminOnly: true },
];

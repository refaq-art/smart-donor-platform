import {
  Code2,
  Palette,
  Megaphone,
  KanbanSquare,
  Languages,
  Sparkles,
  Rocket,
  BarChart3,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "code-2": Code2,
  palette: Palette,
  megaphone: Megaphone,
  "kanban-square": KanbanSquare,
  languages: Languages,
  sparkles: Sparkles,
  rocket: Rocket,
  "bar-chart-3": BarChart3,
  "book-open": BookOpen,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}

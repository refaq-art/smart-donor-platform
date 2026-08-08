'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, Tags, FileUp, Sparkles, ClipboardCheck, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/questions', label: 'الأسئلة', icon: ListChecks },
  { href: '/admin/categories', label: 'التصنيفات', icon: Tags },
  { href: '/admin/tournaments', label: 'البطولات', icon: Trophy },
  { href: '/admin/import-export', label: 'استيراد / تصدير', icon: FileUp },
  { href: '/admin/ai-generate', label: 'توليد بالذكاء الاصطناعي', icon: Sparkles },
  { href: '/admin/ai-generate/review', label: 'مراجعة المولّد', icon: ClipboardCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-panel flex flex-row gap-1 overflow-x-auto rounded-2xl p-2 lg:w-56 lg:flex-col">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition',
              active ? 'bg-primary-gradient text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

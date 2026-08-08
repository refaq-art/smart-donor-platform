'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Trophy, Medal, User, ShieldCheck, LogIn } from 'lucide-react';
import { usePlayer } from '@/components/providers/player-provider';
import { SoundToggle } from './sound-toggle';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/categories', label: 'التصنيفات', icon: LayoutGrid },
  { href: '/tournaments', label: 'البطولات', icon: Medal },
  { href: '/leaderboard', label: 'المتصدرون', icon: Trophy },
  { href: '/profile', label: 'ملفي', icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const { player, role } = usePlayer();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-arena-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-black">
          <span className="text-2xl">🎮</span>
          <span className="text-gradient-primary">حلبة الأسئلة</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition',
                  active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          {role === 'ADMIN' && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-arena-accent2 hover:bg-white/5"
            >
              <ShieldCheck size={16} />
              الإدارة
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <SoundToggle />
          {player ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-3 pr-1 hover:bg-white/10"
            >
              <span className="hidden text-sm font-bold sm:inline">{player.displayName}</span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: player.avatarColor }}
              >
                {player.avatarEmoji}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 rounded-xl bg-primary-gradient px-3 py-2 text-sm font-bold">
              <LogIn size={16} />
              دخول
            </Link>
          )}
        </div>
      </div>

      <nav className="flex items-center justify-around border-t border-white/5 py-1.5 md:hidden">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn('flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-bold', active ? 'text-white' : 'text-white/50')}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePlayer } from '@/components/providers/player-provider';
import { cn } from '@/lib/utils';

export function ActionCard({
  href,
  icon,
  title,
  description,
  requireAuth = true,
  featured = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  requireAuth?: boolean;
  featured?: boolean;
}) {
  const router = useRouter();
  const { player, loading } = usePlayer();

  function go() {
    if (requireAuth && !loading && !player) {
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
      return;
    }
    router.push(href);
  }

  return (
    <motion.button
      onClick={go}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'glass-panel flex flex-col items-start gap-2 rounded-3xl p-5 text-right transition-shadow hover:shadow-glow',
        featured && 'bg-primary-gradient border-none'
      )}
    >
      <div className="text-3xl">{icon}</div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="text-sm text-white/70">{description}</p>
    </motion.button>
  );
}

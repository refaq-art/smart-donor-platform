'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/components/providers/sound-provider';

export function TimerBar({ deadlineAt, onExpire, paused }: { deadlineAt: string; onExpire: () => void; paused?: boolean }) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(deadlineAt).getTime() - Date.now());
  const [totalMs] = useState(() => Math.max(new Date(deadlineAt).getTime() - Date.now(), 1));
  const expiredRef = useRef(false);
  const { play } = useSound();
  const lastSecondRef = useRef<number | null>(null);

  useEffect(() => {
    expiredRef.current = false;
    lastSecondRef.current = null;
  }, [deadlineAt]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const remaining = new Date(deadlineAt).getTime() - Date.now();
      setRemainingMs(remaining);

      const seconds = Math.ceil(remaining / 1000);
      if (seconds <= 3 && seconds >= 0 && seconds !== lastSecondRef.current) {
        lastSecondRef.current = seconds;
        play(seconds === 0 ? 'countdown' : 'tick');
      }

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [deadlineAt, onExpire, paused, play]);

  const percent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const danger = percent < 25;

  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex items-center gap-1 text-lg font-black tabular-nums', danger ? 'text-arena-danger' : 'text-white')}>
        <Clock size={18} className={danger ? 'animate-pulse' : ''} />
        {seconds}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full transition-[width] duration-100 ease-linear', danger ? 'bg-arena-danger' : 'bg-primary-gradient')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

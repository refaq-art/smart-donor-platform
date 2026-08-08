'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function QuickPlayButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function start() {
    setLoading(true);
    try {
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      const categoryIds = catData.categories.filter((c: any) => c.questionCount > 0).map((c: any) => c.id);

      const res = await fetch('/api/game/solo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'QUICK_PLAY', format: 'SOLO', categoryIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        router.push('/play/setup');
        return;
      }
      sessionStorage.setItem(`quiz_game_${data.gameId}`, JSON.stringify(data));
      router.push(`/play/game/${data.gameId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button data-testid="quick-play-button" size="xl" variant="accent" onClick={start} disabled={loading} className="w-full sm:w-auto">
      {loading ? <Spinner /> : <Zap size={20} />}
      لعبة سريعة
    </Button>
  );
}

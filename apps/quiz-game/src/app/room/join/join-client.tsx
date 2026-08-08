'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function JoinRoomClient() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState<'join' | 'watch' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function join(mode: 'join' | 'watch') {
    setError(null);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('رمز الغرفة يتكون من 6 أحرف');
      return;
    }
    setLoading(mode);
    try {
      const res = await fetch(`/api/rooms/${trimmed}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'لا توجد غرفة بهذا الرمز');
        return;
      }
      router.push(mode === 'watch' ? `/room/${trimmed}/watch` : `/room/${trimmed}/lobby`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-black">
        <KeyRound className="text-arena-primary2" /> انضم لغرفة
      </h1>
      <Card className="w-full">
        <p className="mb-4 text-center text-sm text-white/60">أدخل رمز الغرفة المكوّن من 6 أحرف</p>
        <Input
          data-testid="room-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          className="mb-4 text-center text-2xl font-black tracking-[0.3em]"
          onKeyDown={(e) => e.key === 'Enter' && join('join')}
        />
        {error && <p className="mb-4 rounded-xl bg-arena-danger/20 px-4 py-2 text-center text-sm text-arena-danger">{error}</p>}
        <Button size="lg" className="w-full" data-testid="room-join-button" disabled={loading !== null} onClick={() => join('join')}>
          {loading === 'join' ? <Spinner /> : 'انضمام'}
        </Button>
        <Button size="lg" variant="ghost" className="mt-2 w-full" data-testid="room-watch-button" disabled={loading !== null} onClick={() => join('watch')}>
          {loading === 'watch' ? <Spinner /> : (
            <>
              <Eye size={16} /> شاهد كمتفرج
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}

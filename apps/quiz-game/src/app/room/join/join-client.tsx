'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function JoinRoomClient() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function join() {
    setError(null);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('رمز الغرفة يتكون من 6 أحرف');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${trimmed}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'لا توجد غرفة بهذا الرمز');
        return;
      }
      router.push(`/room/${trimmed}/lobby`);
    } finally {
      setLoading(false);
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
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          className="mb-4 text-center text-2xl font-black tracking-[0.3em]"
          onKeyDown={(e) => e.key === 'Enter' && join()}
        />
        {error && <p className="mb-4 rounded-xl bg-arena-danger/20 px-4 py-2 text-center text-sm text-arena-danger">{error}</p>}
        <Button size="lg" className="w-full" disabled={loading} onClick={join}>
          {loading ? <Spinner /> : 'انضمام'}
        </Button>
      </Card>
    </div>
  );
}

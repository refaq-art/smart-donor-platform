'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { usePlayer } from '@/components/providers/player-provider';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Tab = 'login' | 'register' | 'guest';

export function LoginClient() {
  const [tab, setTab] = useState<Tab>('guest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState(AVATAR_EMOJIS[0]);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = usePlayer();

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : tab === 'register' ? '/api/auth/register' : '/api/auth/guest';
      const body =
        tab === 'login'
          ? { email, password }
          : tab === 'register'
            ? { email, password, displayName, avatarEmoji, avatarColor }
            : { displayName, avatarEmoji, avatarColor };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'حدث خطأ');
        return;
      }
      await refresh();
      router.push(searchParams.get('redirect') ?? '/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-black text-gradient-primary">مرحبًا بك 👋</h1>
        <p className="mt-1 text-white/60">سجّل دخولك أو العب كضيف مباشرة</p>
      </motion.div>

      <Card className="w-full">
        <div className="mb-5 flex rounded-xl bg-arena-surface2 p-1">
          {(['guest', 'login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-bold transition',
                tab === t ? 'bg-primary-gradient text-white' : 'text-white/50 hover:text-white'
              )}
            >
              {t === 'guest' ? 'ضيف' : t === 'login' ? 'دخول' : 'حساب جديد'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {(tab === 'guest' || tab === 'register') && (
            <div>
              <Label>اسم اللاعب</Label>
              <Input
                data-testid="display-name-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثال: أبو فهد"
                maxLength={30}
              />
            </div>
          )}

          {(tab === 'login' || tab === 'register') && (
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          )}

          {(tab === 'login' || tab === 'register') && (
            <div>
              <Label>كلمة المرور</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}

          {(tab === 'guest' || tab === 'register') && (
            <div>
              <Label>اختر رمزك</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_EMOJIS.slice(0, 10).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatarEmoji(emoji)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-xl transition',
                      avatarEmoji === emoji ? 'ring-2 ring-arena-primary2' : 'opacity-60 hover:opacity-100'
                    )}
                    style={{ backgroundColor: avatarColor }}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAvatarColor(color)}
                    className={cn('h-6 w-6 rounded-full transition', avatarColor === color && 'ring-2 ring-white')}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-arena-danger/20 px-3 py-2 text-sm text-arena-danger">{error}</p>}

          <Button data-testid="auth-submit" size="lg" disabled={loading} onClick={submit}>
            {loading ? 'جارٍ التحميل...' : tab === 'guest' ? 'العب الآن 🎮' : tab === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

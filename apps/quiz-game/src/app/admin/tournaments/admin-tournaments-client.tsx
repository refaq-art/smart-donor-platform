'use client';

import { useEffect, useState } from 'react';
import { Trophy, Ban, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { DIFFICULTY_LABELS } from '@/lib/constants';
import { computeTournamentPhase, TOURNAMENT_PHASE_LABELS, type TournamentPhase } from '@/lib/tournament';

interface CategoryOption {
  id: string;
  nameAr: string;
  icon: string;
}

interface TournamentRow {
  id: string;
  nameAr: string;
  descriptionAr: string | null;
  status: string;
  categoryId: string | null;
  category: { nameAr: string; icon: string } | null;
  difficulty: string | null;
  questionCount: number;
  startAt: string;
  endAt: string;
  _count: { participants: number };
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminTournamentsClient() {
  const [tournaments, setTournaments] = useState<TournamentRow[] | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inHour = new Date(Date.now() + 60 * 60 * 1000);
  const inWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    nameAr: '',
    descriptionAr: '',
    categoryId: '',
    difficulty: '',
    questionCount: 10,
    startAt: toLocalInputValue(inHour),
    endAt: toLocalInputValue(inWeek),
  });

  async function load() {
    const [tRes, cRes] = await Promise.all([fetch('/api/admin/tournaments'), fetch('/api/admin/categories')]);
    const tData = await tRes.json();
    const cData = await cRes.json();
    setTournaments(tData.tournaments);
    setCategories(cData.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: form.nameAr,
          descriptionAr: form.descriptionAr || null,
          categoryId: form.categoryId || null,
          difficulty: form.difficulty || null,
          questionCount: Number(form.questionCount),
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'حدث خطأ');
        return;
      }
      setForm((f) => ({ ...f, nameAr: '', descriptionAr: '' }));
      load();
    } finally {
      setCreating(false);
    }
  }

  async function cancelTournament(id: string) {
    await fetch(`/api/admin/tournaments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    load();
  }

  if (!tournaments) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-black">
        <Trophy className="text-arena-gold" /> البطولات
      </h1>

      <Card className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 font-extrabold">
          <Plus size={18} /> إنشاء بطولة جديدة
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>اسم البطولة</Label>
            <Input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="بطولة نهاية الأسبوع" />
          </div>
          <div>
            <Label>التصنيف (اختياري)</Label>
            <Select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.nameAr}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>الوصف (اختياري)</Label>
            <Textarea value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>الصعوبة (اختياري)</Label>
            <Select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
              <option value="">مختلطة</option>
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>عدد الأسئلة</Label>
            <Input
              type="number"
              min={3}
              max={50}
              value={form.questionCount}
              onChange={(e) => setForm((f) => ({ ...f, questionCount: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label>وقت البدء</Label>
            <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} />
          </div>
          <div>
            <Label>وقت الانتهاء</Label>
            <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} />
          </div>
        </div>
        {error && <p className="mt-3 rounded-xl bg-arena-danger/20 px-4 py-2 text-sm text-arena-danger">{error}</p>}
        <Button className="mt-4" disabled={creating || !form.nameAr.trim()} onClick={create}>
          {creating ? <Spinner /> : 'إنشاء البطولة'}
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        {tournaments.map((t) => {
          const phase: TournamentPhase = computeTournamentPhase(t);
          return (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-extrabold">{t.nameAr}</h3>
                    <Badge tone={phase === 'ACTIVE' ? 'success' : phase === 'UPCOMING' ? 'primary' : phase === 'CANCELLED' ? 'danger' : 'neutral'}>
                      {TOURNAMENT_PHASE_LABELS[phase]}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40">
                    {t.category ? `${t.category.icon} ${t.category.nameAr}` : 'كل التصنيفات'} · {t.questionCount} سؤال ·{' '}
                    {t._count.participants.toLocaleString('ar')} مشارك
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    {new Date(t.startAt).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })} →{' '}
                    {new Date(t.endAt).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {phase !== 'CANCELLED' && phase !== 'COMPLETED' && (
                  <Button size="sm" variant="ghost" onClick={() => cancelTournament(t.id)}>
                    <Ban size={14} /> إلغاء
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
        {tournaments.length === 0 && <p className="py-8 text-center text-white/40">لا توجد بطولات بعد</p>}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface CategoryRow {
  id: string;
  key: string;
  nameAr: string;
  icon: string;
  colorHex: string;
  isActive: boolean;
  _count: { questions: number };
}

export function CategoriesClient() {
  const [categories, setCategories] = useState<CategoryRow[] | null>(null);
  const [key, setKey] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCategories(data.categories);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, nameAr, icon }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setKey('');
      setNameAr('');
      setIcon('🎯');
      load();
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(c: CategoryRow) {
    await fetch(`/api/admin/categories/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  }

  async function remove(c: CategoryRow) {
    if (!confirm(`حذف تصنيف "${c.nameAr}"؟`)) return;
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">🗂️ إدارة التصنيفات</h1>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">إضافة تصنيف جديد</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label>الرمز التعبيري</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
          </div>
          <div>
            <Label>الاسم بالعربية</Label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </div>
          <div>
            <Label>المفتاح (إنجليزي)</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} placeholder="e.g. space" />
          </div>
          <div className="flex items-end">
            <Button disabled={creating || !key || !nameAr} onClick={create} className="w-full">
              <Plus size={16} /> إضافة
            </Button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-arena-danger">{error}</p>}
      </Card>

      <Card>
        {!categories ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                <span className="text-xl">{c.icon}</span>
                <span className="flex-1 font-bold">{c.nameAr}</span>
                <Badge tone="neutral">{c._count.questions} سؤال</Badge>
                <Badge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'مفعّل' : 'معطّل'}</Badge>
                <button onClick={() => toggleActive(c)} className="text-white/50 hover:text-white">
                  <Power size={16} />
                </button>
                <button onClick={() => remove(c)} className="text-white/50 hover:text-arena-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

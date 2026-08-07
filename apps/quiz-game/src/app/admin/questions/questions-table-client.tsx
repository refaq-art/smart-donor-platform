'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '@/lib/constants';

interface CategoryOption {
  id: string;
  nameAr: string;
  icon: string;
}

interface QuestionRow {
  id: string;
  textAr: string;
  type: string;
  difficulty: string;
  status: string;
  source: string;
  category: { nameAr: string; icon: string };
  answers: { textAr: string; isCorrect: boolean }[];
}

export function QuestionsTableClient() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [items, setItems] = useState<QuestionRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');

  const pageSize = 20;

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  const load = useCallback(async () => {
    setItems(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    if (difficulty) params.set('difficulty', difficulty);
    if (status) params.set('status', status);

    const res = await fetch(`/api/admin/questions?${params}`);
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  }, [page, search, categoryId, difficulty, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">❓ إدارة الأسئلة</h1>
        <Link href="/admin/questions/new">
          <Button>
            <Plus size={16} /> سؤال جديد
          </Button>
        </Link>
      </div>

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="ابحث في نص السؤال..."
              className="pr-9"
            />
          </div>
          <Select
            value={categoryId}
            onChange={(e) => {
              setPage(1);
              setCategoryId(e.target.value);
            }}
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.nameAr}
              </option>
            ))}
          </Select>
          <Select
            value={difficulty}
            onChange={(e) => {
              setPage(1);
              setDifficulty(e.target.value);
            }}
          >
            <option value="">كل المستويات</option>
            {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">كل الحالات</option>
            <option value="ACTIVE">مفعّل</option>
            <option value="DISABLED">معطّل</option>
            <option value="PENDING_REVIEW">بانتظار المراجعة</option>
            <option value="REJECTED">مرفوض</option>
          </Select>
        </div>
      </Card>

      <Card>
        {!items ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-white/40">لا توجد أسئلة مطابقة</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-right text-white/50">
                  <th className="p-2">السؤال</th>
                  <th className="p-2">التصنيف</th>
                  <th className="p-2">النوع</th>
                  <th className="p-2">الصعوبة</th>
                  <th className="p-2">الحالة</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((q) => (
                  <tr key={q.id} className="border-b border-white/5">
                    <td className="max-w-xs truncate p-2 font-bold">{q.textAr}</td>
                    <td className="p-2 text-white/60">
                      {q.category.icon} {q.category.nameAr}
                    </td>
                    <td className="p-2 text-white/60">{QUESTION_TYPE_LABELS[q.type]}</td>
                    <td className="p-2 text-white/60">{DIFFICULTY_LABELS[q.difficulty]}</td>
                    <td className="p-2">
                      <Badge
                        tone={q.status === 'ACTIVE' ? 'success' : q.status === 'PENDING_REVIEW' ? 'accent' : 'neutral'}
                      >
                        {q.status === 'ACTIVE' ? 'مفعّل' : q.status === 'DISABLED' ? 'معطّل' : q.status === 'PENDING_REVIEW' ? 'مراجعة' : 'مرفوض'}
                      </Badge>
                    </td>
                    <td className="flex items-center justify-end gap-2 p-2">
                      <Link href={`/admin/questions/${q.id}/edit`} className="text-white/50 hover:text-white">
                        <Pencil size={16} />
                      </Link>
                      <button onClick={() => remove(q.id)} className="text-white/50 hover:text-arena-danger">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span className="text-sm text-white/50">
            صفحة {page} من {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}

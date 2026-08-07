'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface CategoryOption {
  id: string;
  key: string;
  nameAr: string;
  icon: string;
  colorHex: string;
  description: string | null;
  questionCount: number;
}

export function CategoriesClient() {
  const [categories, setCategories] = useState<CategoryOption[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  if (!categories) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">🗂️ التصنيفات</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card
              className="flex cursor-pointer flex-col items-center gap-2 text-center transition hover:shadow-glow"
              onClick={() => router.push(`/play/setup?category=${c.id}`)}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: `${c.colorHex}30` }}>
                {c.icon}
              </div>
              <h3 className="font-extrabold">{c.nameAr}</h3>
              <Badge tone="neutral">{c.questionCount} سؤال</Badge>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

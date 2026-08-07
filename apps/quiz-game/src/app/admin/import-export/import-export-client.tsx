'use client';

import { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Format = 'csv' | 'xlsx' | 'json';

const FORMAT_META: Record<Format, { label: string; icon: typeof FileText }> = {
  csv: { label: 'CSV', icon: FileText },
  xlsx: { label: 'Excel (XLSX)', icon: FileSpreadsheet },
  json: { label: 'JSON', icon: FileJson },
};

export function ImportExportClient() {
  const [format, setFormat] = useState<Format>('xlsx');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ insertedCount: number; totalRows: number; errors: { row: number; message: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport(file: File) {
    setImporting(true);
    setResult(null);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('format', format);
      const res = await fetch('/api/admin/questions/import', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        setResult({ insertedCount: 0, totalRows: 0, errors: [{ row: 0, message: data.error }] });
        return;
      }
      setResult(data);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function downloadExport() {
    window.location.href = `/api/admin/questions/export?format=${format}`;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">📥📤 استيراد وتصدير الأسئلة</h1>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">الصيغة</h2>
        <div className="flex gap-2">
          {(Object.keys(FORMAT_META) as Format[]).map((f) => {
            const Icon = FORMAT_META[f].icon;
            return (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold ${
                  format === f ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2'
                }`}
              >
                <Icon size={16} /> {FORMAT_META[f].label}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-extrabold">
            <Download size={18} /> تصدير
          </h2>
          <p className="mb-4 text-sm text-white/60">صدّر كل الأسئلة الحالية بالصيغة المختارة.</p>
          <Button onClick={downloadExport} className="w-full">
            تنزيل الملف
          </Button>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-extrabold">
            <Upload size={18} /> استيراد
          </h2>
          <p className="mb-4 text-sm text-white/60">
            {format === 'json'
              ? 'ملف JSON بمصفوفة من الأسئلة (نفس صيغة التصدير).'
              : 'ملف بأعمدة: categoryKey, type, difficulty, textAr, ... answer1..answer6 (نفس صيغة التصدير).'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={format === 'json' ? '.json' : format === 'csv' ? '.csv' : '.xlsx'}
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            className="mb-3 block w-full text-sm text-white/60"
          />
          {importing && <Spinner />}
          {result && (
            <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm">
              <p className="font-bold text-arena-success">تمت إضافة {result.insertedCount} من {result.totalRows} سؤال</p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-arena-danger">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      صف {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

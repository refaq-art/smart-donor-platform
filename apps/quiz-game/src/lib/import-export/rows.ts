export const ANSWER_SLOTS = 6;

export const FLAT_COLUMNS: string[] = [
  'categoryKey',
  'type',
  'difficulty',
  'textAr',
  'imageUrl',
  'explanationAr',
  'timeLimitSeconds',
  'basePoints',
  'status',
  ...Array.from({ length: ANSWER_SLOTS }, (_, i) => [`answer${i + 1}`, `answer${i + 1}Correct`, `answer${i + 1}Order`]).flat(),
];

export interface QuestionExportSource {
  type: string;
  difficulty: string;
  textAr: string;
  imageUrl: string | null;
  explanationAr: string | null;
  timeLimitSeconds: number;
  basePoints: number;
  status: string;
  category: { key: string };
  answers: { textAr: string; isCorrect: boolean; orderIndex: number | null }[];
}

export function questionToRow(q: QuestionExportSource): Record<string, string | number> {
  const row: Record<string, string | number> = {
    categoryKey: q.category.key,
    type: q.type,
    difficulty: q.difficulty,
    textAr: q.textAr,
    imageUrl: q.imageUrl ?? '',
    explanationAr: q.explanationAr ?? '',
    timeLimitSeconds: q.timeLimitSeconds,
    basePoints: q.basePoints,
    status: q.status,
  };
  q.answers.slice(0, ANSWER_SLOTS).forEach((a, i) => {
    row[`answer${i + 1}`] = a.textAr;
    row[`answer${i + 1}Correct`] = a.isCorrect ? 'TRUE' : 'FALSE';
    row[`answer${i + 1}Order`] = a.orderIndex ?? '';
  });
  return row;
}

export interface QuestionDraft {
  categoryKey: string;
  type: string;
  difficulty: string;
  textAr: string;
  imageUrl: string | null;
  explanationAr: string | null;
  timeLimitSeconds: number;
  basePoints: number;
  status: string;
  answers: { textAr: string; isCorrect: boolean; orderIndex: number | null }[];
}

export function rowToDraft(row: Record<string, string | number | undefined>): QuestionDraft {
  const answers: QuestionDraft['answers'] = [];
  for (let i = 1; i <= ANSWER_SLOTS; i++) {
    const text = row[`answer${i}`];
    if (!text || String(text).trim() === '') continue;
    const correctRaw = String(row[`answer${i}Correct`] ?? '').trim().toUpperCase();
    const orderRaw = row[`answer${i}Order`];
    answers.push({
      textAr: String(text).trim(),
      isCorrect: correctRaw === 'TRUE' || correctRaw === '1' || correctRaw === 'YES' || correctRaw === 'نعم',
      orderIndex: orderRaw !== undefined && orderRaw !== '' ? Number(orderRaw) : null,
    });
  }

  return {
    categoryKey: String(row.categoryKey ?? '').trim(),
    type: String(row.type ?? '').trim().toUpperCase(),
    difficulty: String(row.difficulty ?? '').trim().toUpperCase(),
    textAr: String(row.textAr ?? '').trim(),
    imageUrl: row.imageUrl ? String(row.imageUrl).trim() : null,
    explanationAr: row.explanationAr ? String(row.explanationAr).trim() : null,
    timeLimitSeconds: Number(row.timeLimitSeconds ?? 20) || 20,
    basePoints: Number(row.basePoints ?? 1000) || 1000,
    status: String(row.status ?? 'ACTIVE').trim().toUpperCase() || 'ACTIVE',
    answers,
  };
}

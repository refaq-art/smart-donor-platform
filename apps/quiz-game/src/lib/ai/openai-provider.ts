import type { AIGenerateOutcome, AIGenerateParams, AIProvider, AIQuestionDraft } from './types';
import { BASE_POINTS_BY_DIFFICULTY, TIME_LIMIT_BY_DIFFICULTY } from '@/lib/constants';

const SYSTEM_PROMPT = `أنت مساعد متخصص في توليد أسئلة مسابقات ثقافية عربية عالية الجودة.
أعد الاستجابة بصيغة JSON فقط بدون أي نص إضافي، على شكل مصفوفة من الكائنات بالحقول التالية لكل سؤال:
{"textAr": "نص السؤال", "explanationAr": "شرح مختصر للإجابة الصحيحة", "answers": [{"textAr": "نص الإجابة", "isCorrect": true|false}]}
تأكد أن الأسئلة دقيقة معلوماتيًا، خالية من الغموض، وباللغة العربية الفصحى.`;

export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string
  ) {}

  async generate(params: AIGenerateParams): Promise<AIGenerateOutcome> {
    const userPrompt = buildUserPrompt(params);

    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`فشل الاتصال بمزود الذكاء الاصطناعي (${response.status})`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '[]';
    const parsed = safeParseQuestions(content);

    const drafts: AIQuestionDraft[] = parsed.map((q) => ({
      textAr: q.textAr,
      type: params.type,
      difficulty: params.difficulty,
      explanationAr: q.explanationAr ?? '',
      timeLimitSeconds: TIME_LIMIT_BY_DIFFICULTY[params.difficulty],
      basePoints: BASE_POINTS_BY_DIFFICULTY[params.difficulty],
      answers: q.answers.map((a, i) => ({ textAr: a.textAr, isCorrect: a.isCorrect, orderIndex: params.type === 'ORDERING' ? i : null })),
    }));

    return { drafts: drafts.slice(0, params.count) };
  }
}

function buildUserPrompt(params: AIGenerateParams) {
  return `ولّد ${params.count} سؤال من نوع "${params.type}" بمستوى صعوبة "${params.difficulty}" في تصنيف "${params.categoryNameAr}".
أعد النتيجة ككائن JSON بالشكل: {"questions": [...]} حيث "questions" مصفوفة بالبنية الموضحة في التعليمات.`;
}

function safeParseQuestions(content: string): { textAr: string; explanationAr?: string; answers: { textAr: string; isCorrect: boolean }[] }[] {
  try {
    const parsed = JSON.parse(content);
    const list = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

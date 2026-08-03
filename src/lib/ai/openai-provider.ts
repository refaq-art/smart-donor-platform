import type { AIProvider, AIRequest, AIResult } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { mockProvider } from "./mock-provider";

export function createOpenAIProvider(): AIProvider {
  return {
    name: "openai",
    async run(req: AIRequest): Promise<AIResult> {
      const apiKey = process.env.AI_API_KEY;
      const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
      const model = process.env.AI_MODEL || "gpt-4o-mini";

      if (!apiKey) {
        const fallback = await mockProvider.run(req);
        return {
          ...fallback,
          warning:
            "لم يتم ضبط مفتاح AI_API_KEY رغم اختيار مزود خارجي — تم استخدام الوضع التجريبي كبديل. أضف المفتاح في ملف البيئة لتفعيل الذكاء الاصطناعي الحقيقي.",
        };
      }

      const userPrompt = buildUserPrompt(req.action, req.context);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.4,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.status === 429) {
          const fallback = await mockProvider.run(req);
          return { ...fallback, warning: "تم تجاوز الحد المجاني لمزود الذكاء الاصطناعي (429). تم عرض نتيجة تجريبية بديلة." };
        }

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          const fallback = await mockProvider.run(req);
          return {
            ...fallback,
            warning: `تعذّر الاتصال بمزود الذكاء الاصطناعي (رمز الحالة ${res.status}). تم عرض نتيجة تجريبية بديلة. ${body.slice(0, 150)}`,
          };
        }

        const data = await res.json();
        const text: string | undefined = data?.choices?.[0]?.message?.content;
        if (!text) {
          const fallback = await mockProvider.run(req);
          return { ...fallback, warning: "لم يُرجع المزود محتوى صالحًا. تم عرض نتيجة تجريبية بديلة." };
        }

        return { text, provider: "openai" };
      } catch (err) {
        const fallback = await mockProvider.run(req);
        const message = err instanceof Error ? err.message : "خطأ غير معروف";
        return {
          ...fallback,
          warning: `تعذّر الوصول إلى خدمة الذكاء الاصطناعي (${message}). تم عرض نتيجة تجريبية بديلة حتى تستعيد الخدمة عملها.`,
        };
      }
    },
  };
}

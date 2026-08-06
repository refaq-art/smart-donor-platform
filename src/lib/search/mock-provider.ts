import type { SearchProvider, SearchResult } from "./types";

// وضع تجريبي: يعيد نتائج توضيحية واضحة المصدر (لا تُقدَّم كبيانات حقيقية أبدًا)
// حتى يعمل مسار اكتشاف المانحين كاملًا محليًا دون مفتاح بحث حقيقي.
export const mockSearchProvider: SearchProvider = {
  name: "mock",
  async search(query: string): Promise<SearchResult[]> {
    return [
      {
        title: `[مثال توضيحي] نتيجة بحث تجريبية عن: ${query}`,
        url: "https://example.com/demo-donor-result",
        snippet:
          "هذه نتيجة تجريبية للتوضيح فقط — لا تمثل جهة مانحة حقيقية. لتفعيل بحث حقيقي عن مانحين جدد، اضبط SEARCH_PROVIDER ومفتاح API في متغيرات البيئة.",
      },
    ];
  },
};

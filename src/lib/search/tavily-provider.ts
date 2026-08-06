import type { SearchProvider, SearchResult } from "./types";

// Tavily: محرك بحث مصمم خصيصًا لوكلاء الذكاء الاصطناعي، بخطة مجانية سخية.
// https://docs.tavily.com/documentation/api-reference/endpoint/search
export const tavilySearchProvider: SearchProvider = {
  name: "tavily",
  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    const apiKey = process.env.SEARCH_API_KEY;
    if (!apiKey) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: maxResults,
          search_depth: "basic",
          include_answer: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return [];

      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      return results
        .filter((r: unknown): r is Record<string, unknown> => typeof r === "object" && r !== null)
        .map((r: Record<string, unknown>) => ({
          title: typeof r.title === "string" ? r.title : "",
          url: typeof r.url === "string" ? r.url : "",
          snippet: typeof r.content === "string" ? r.content.slice(0, 800) : "",
        }))
        .filter((r: SearchResult) => r.title && r.url);
    } catch {
      clearTimeout(timeout);
      return [];
    }
  },
};

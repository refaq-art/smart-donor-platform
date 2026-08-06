export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export interface SearchProvider {
  name: "mock" | "tavily";
  search(query: string, maxResults: number): Promise<SearchResult[]>;
}

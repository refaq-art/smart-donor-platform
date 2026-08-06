import type { SearchProvider } from "./types";
import { mockSearchProvider } from "./mock-provider";
import { tavilySearchProvider } from "./tavily-provider";

export function getSearchProvider(): SearchProvider {
  const providerName = (process.env.SEARCH_PROVIDER || "mock").toLowerCase();
  if (providerName === "tavily") return tavilySearchProvider;
  return mockSearchProvider;
}

export * from "./types";

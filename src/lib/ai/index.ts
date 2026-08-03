import type { AIProvider } from "./types";
import { mockProvider } from "./mock-provider";
import { createOpenAIProvider } from "./openai-provider";

export function getAIProvider(): AIProvider {
  const providerName = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (providerName === "openai") return createOpenAIProvider();
  return mockProvider;
}

export * from "./types";
export { ACTION_LABELS } from "./prompts";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

export const availableModels: ModelInfo[] = [
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "OpenAI",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
  },
  {
    id: "anthropic/claude-haiku-3.5",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "Google",
  },
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
  },
];

export const defaultModel = availableModels[0]!;

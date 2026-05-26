export type Idea = {
  title: string;
  hook: string;
  type: string;
  angle: string;
  caption: string;
  score: { creativity: number; virality: number; uniqueness: number };
};

export type TokenUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type AgentResult = {
  analysis: {
    topics: string[];
    formats: string[];
    hooks: string[];
    tone: string;
    high_performing_insights?: string;
  };
  avoid: string[];
  ideas: Idea[];
  best_ideas: Idea[];
  tokenUsage?: TokenUsage;
};

export type HistoryEntry = {
  id: string;
  accountId: string;
  generatedAt: string;
  niche: string;
  contentType: string;
  userPrompt: string;
  ideaCount: number;
  result: AgentResult;
};

export type ScrapedContent = {
  title: string;
  description?: string;
  stats?: string;
};

export type ScrapeResult = {
  profile: { name: string; bio: string };
  total_contents: number;
  contents: ScrapedContent[];
};

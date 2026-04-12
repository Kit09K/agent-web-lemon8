import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.KKU_API_KEY,
  baseURL: "https://gen.ai.kku.ac.th/api/v1",
});

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---- Types ----
export type ScrapedContent = {
  title: string;
  description?: string;
  stats?: string;
};

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

type AgentError = { error: string; raw?: string };

// ---- History per account ----
function historyPath(accountId: string): string {
  return path.join(DATA_DIR, `history_${accountId}.json`);
}

export function loadHistoryAll(): Record<string, HistoryEntry[]> {
  ensureDataDir();
  const result: Record<string, HistoryEntry[]> = {};
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith("history_") && f.endsWith(".json"));
    for (const file of files) {
      const accountId = file.replace("history_", "").replace(".json", "");
      try {
        const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
        result[accountId] = JSON.parse(raw);
      } catch {
        result[accountId] = [];
      }
    }
  } catch {
    /* silent */
  }
  return result;
}

function loadHistoryForAccount(accountId: string): HistoryEntry[] {
  try {
    const p = historyPath(accountId);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return [];
  }
}

function saveHistoryEntry(entry: HistoryEntry): void {
  ensureDataDir();
  const existing = loadHistoryForAccount(entry.accountId);
  const updated = [...existing, entry];
  fs.writeFileSync(historyPath(entry.accountId), JSON.stringify(updated, null, 2), "utf-8");
}

// ---- Extract JSON ----
function extractJSON(raw: string): string {
  if (!raw) return "";
  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    return raw.slice(braceStart, braceEnd + 1);
  }
  return raw.trim();
}

// ---- Build system prompt based on content type + counts ----
function buildSystemPrompt(contentType: string, ideaCount: number): string {
  const contentTypeGuidance: Record<string, string> = {
    viral_hook: "Focus on SURPRISING hooks, emotional triggers, and content that makes people stop scrolling. The first line must be irresistible.",
    story: "Focus on personal narrative structure: relatable situation → conflict/discovery → resolution/lesson. Make it feel human and genuine.",
    list_tips: "Focus on numbered lists, actionable advice, and 'aha moment' insights. Title should promise clear value (e.g., '5 things I wish I knew...').",
    tutorial: "Focus on step-by-step instructions with clear outcomes. Emphasize transformation: before/after or problem/solution.",
    opinion: "Focus on bold takes, personal reviews, or contrarian views. Hook with a strong stance the audience agrees or disagrees with.",
    aesthetic: "Focus on mood, vibe, and visual storytelling. Use evocative language, sensory details, and atmospheric captions.",
    question: "Focus on engaging questions that prompt comments and saves. Create curiosity gaps or FOMO.",
    compare: "Focus on A vs B structure, comparison tables, or 'Which is better?' formats that drive engagement.",
  };

  const guidance = contentTypeGuidance[contentType] || contentTypeGuidance["viral_hook"];
  const bestCount = Math.max(1, Math.ceil(ideaCount / 3));

  return `You are an expert Lemon8 content strategist, viral content creator, and creative AI agent.
Your goal is to analyze ALL provided content (scraped profile posts AND previously generated ideas), avoid 100% repetition, and generate HIGH-QUALITY, VIRAL, and completely fresh content ideas.

========================
CONTENT TYPE FOCUS: ${contentType.toUpperCase()}
========================
${guidance}
ALL generated ideas MUST fit this content type format.

========================
STEP 1: ANALYZE & FIND WINNING PATTERNS
========================
Analyze the provided SCRAPED PROFILE POSTS and their Like counts.
Extract:
- Main Topics already covered in the profile
- Content Formats used
- Hook Patterns that performed well
- Tone & Style
- High-Performing Insights: What made the top-liked posts go viral?

========================
STEP 2: STRICT DEDUPLICATION CHECK (CRITICAL — READ CAREFULLY)
========================
You will receive TWO separate lists:
A) SCRAPED PROFILE POSTS — real content already published on this Lemon8 account
B) PREVIOUSLY GENERATED IDEAS — ideas already suggested in past AI sessions

You MUST build an AVOID LIST that combines BOTH sources.
- Do NOT generate any idea that overlaps in topic, angle, or core message with ANY item in either list.
- Overlapping means: same subject matter, same question being answered, same life situation, or same product category.
- Different wording of the same idea = STILL a duplicate. Be strict.

========================
STEP 3: GENERATE ${ideaCount} NEW IDEAS
========================
Generate exactly ${ideaCount} NEW content ideas that:
- Have ZERO overlap with both the scraped posts AND previously generated ideas
- Match the content type: ${contentType}
- Apply winning hook/format patterns from high-liked posts — but to entirely NEW subjects
- Fit Lemon8 viral style (relatable, aesthetic, engaging)
- Incorporate the user's additional requirements if provided

========================
STEP 4: CAPTIONS
========================
For EACH of the ${ideaCount} ideas, generate:
- Title (compelling, platform-native)
- Hook (the very first line — make it irresistible)
- Content Type (must match requested type)
- Angle (unique perspective not used before)
- Caption (catchy opener, emojis, short body paragraph, 3-5 hashtags)

========================
STEP 5: SCORING & BEST PICKS
========================
Score each idea (1-10): Creativity, Virality, Uniqueness.
Select the BEST ${bestCount} idea${bestCount > 1 ? "s" : ""} and return their FULL objects in best_ideas.

========================
ABSOLUTE RULES
========================
- ideas array MUST contain exactly ${ideaCount} items
- best_ideas array MUST contain exactly ${bestCount} item${bestCount > 1 ? "s" : ""}
- NEVER repeat any topic from either the profile posts or previous generated ideas
- Output MUST BE VALID JSON ONLY — no markdown, no prefix, no suffix, no explanation

========================
OUTPUT FORMAT (STRICT JSON ONLY)
========================
{
  "analysis": { 
    "topics": [], 
    "formats": [], 
    "hooks": [], 
    "tone": "",
    "high_performing_insights": ""
  },
  "avoid": [],
  "ideas": [
    { "title": "", "hook": "", "type": "", "angle": "", "caption": "", "score": { "creativity": 0, "virality": 0, "uniqueness": 0 } }
  ],
  "best_ideas": [
    { "title": "", "hook": "", "type": "", "angle": "", "caption": "", "score": { "creativity": 0, "virality": 0, "uniqueness": 0 } }
  ]
}`;
}

const DEFAULT_MODEL = "gemini-3.1-pro-preview";
export const TOKEN_LIMIT = 100000; // กำหนด limit ที่นี่ — ปรับได้ตาม plan

export async function runIdeaAgent(options: {
  niche: string;
  contentType: string;
  userPrompt?: string;
  accountId: string;
  ideaCount?: number;
  model?: string;
  externalHistory?: ScrapedContent[];
}): Promise<AgentResult | AgentError> {
  const {
    niche,
    contentType,
    userPrompt = "",
    accountId,
    ideaCount = 5,
    model = DEFAULT_MODEL,
    externalHistory,
  } = options;

  ensureDataDir();

  // --- Section A: Scraped profile posts (for analysis + dedup) ---
  const scrapedSection = (externalHistory && externalHistory.length > 0)
    ? externalHistory.slice(0, 40).map((c, i) => {
        const parts = [`${i + 1}. Title: "${c.title}"`];
        if (c.description) parts.push(`   Description: ${c.description}`);
        if (c.stats) parts.push(`   Likes: ${c.stats}`);
        return parts.join("\n");
      }).join("\n\n")
    : null;

  // --- Section B: Previously generated ideas for this account (for dedup only) ---
  const accountHistory = loadHistoryForAccount(accountId);
  const previousIdeas = accountHistory.flatMap((entry) => entry.result.ideas);
  const generatedSection = previousIdeas.length > 0
    ? previousIdeas
        .slice(-60) // keep last 60 generated ideas as dedup context
        .map((idea, i) => `${i + 1}. "${idea.title}" | Type: ${idea.type} | Angle: ${idea.angle}`)
        .join("\n")
    : null;

  // --- Build user message with clear separation ---
  const userMessage = `
Niche: ${niche}
Content Type Requested: ${contentType}
Number of Ideas to Generate: ${ideaCount}
${userPrompt ? `\nAdditional Requirements from User: "${userPrompt}"\n` : ""}

==============================================
[SECTION A] SCRAPED PROFILE POSTS (Published Content — Analyze + Avoid)
==============================================
${scrapedSection ?? "No scraped data available. Skip Section A analysis."}

==============================================
[SECTION B] PREVIOUSLY GENERATED IDEAS (Past AI sessions — Avoid Only)
==============================================
${generatedSection ?? "No previously generated ideas yet."}

==============================================
TASK
==============================================
1. Analyze Section A deeply — find winning patterns from high-liked posts.
2. Build your AVOID LIST from BOTH Section A (all titles) AND Section B (all titles + angles).
3. Generate exactly ${ideaCount} brand-new ideas with ZERO overlap against both sections.
${userPrompt ? `4. Make sure to incorporate the user's requirements: "${userPrompt}"` : ""}

Output VALID JSON ONLY.
`;

  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 100000,
      temperature: 0.75,
      messages: [
        { role: "system", content: buildSystemPrompt(contentType, ideaCount) },
        { role: "user", content: userMessage },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";

    console.log("=== RAW AI RESPONSE START ===");
    console.log(raw);
    console.log("=== RAW AI RESPONSE END ===");

    if (!raw.trim()) {
      return { error: "empty_response", raw: "AI returned empty content" };
    }

    const clean = extractJSON(raw);

    let result: AgentResult;
    try {
      result = JSON.parse(clean);
    } catch {
      console.error("❌ JSON Parse Failed:", clean);
      return { error: "invalid_json", raw: clean };
    }

    if (!result?.ideas || !result?.best_ideas) {
      return { error: "bad_response", raw: clean };
    }

    // Attach token usage to result
    const usage = response.usage;
    if (usage) {
      result.tokenUsage = {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      };
    }

    // Save full history entry
    const entry: HistoryEntry = {
      id: `${accountId}_${Date.now()}`,
      accountId,
      generatedAt: new Date().toISOString(),
      niche,
      contentType,
      userPrompt,
      ideaCount,
      result,
    };

    saveHistoryEntry(entry);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "api_connection_failed";
    console.error("API call error:", message);
    return { error: message };
  }
}
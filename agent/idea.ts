import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.KKU_API_KEY,
  baseURL: "https://gen.ai.kku.ac.th/api/v1",
});

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const SCRAPED_PATH = path.join(DATA_DIR, "scraped.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---- Types ----
export type ScrapedContent = {
  title: string;
  description?: string;
  stats?: string;
};

type HistoryItem = {
  title: string;
  caption: string;
  type?: string;
  date: string;
};

type Idea = {
  title: string;
  hook: string;
  type: string;
  angle: string;
  caption: string;
  score: { creativity: number; virality: number; uniqueness: number };
};

type AgentResult = {
  analysis: { topics: string[]; formats: string[]; hooks: string[]; tone: string };
  avoid: string[];
  ideas: Idea[];
  best_ideas: Idea[];
};

type AgentError = { error: string; raw?: string };

// ---- History ----
function loadHistory(): HistoryItem[] {
  try {
    if (!fs.existsSync(HISTORY_PATH)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
  } catch { return []; }
}

// อ่าน scraped.json ถ้ามี
function loadScraped(): ScrapedContent[] {
  try {
    if (!fs.existsSync(SCRAPED_PATH)) return [];
    const data = JSON.parse(fs.readFileSync(SCRAPED_PATH, "utf-8"));
    return data.contents || [];
  } catch { return []; }
}

const MAX_HISTORY = 20;

function isDuplicate(existing: HistoryItem[], item: HistoryItem): boolean {
  return existing.some(
    (e) => e.title.trim().toLowerCase() === item.title.trim().toLowerCase()
  );
}

function saveToHistory(items: HistoryItem[]): void {
  ensureDataDir();
  const existing = loadHistory();
  const filtered = items.filter((item) => !isDuplicate(existing, item));
  const updated = [...existing, ...filtered].slice(-MAX_HISTORY);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(updated, null, 2), "utf-8");
}

// ---- Extract JSON จาก raw string (แก้ invalid_json) ----
function extractJSON(raw: string): string {
  if (!raw) return "";
  const direct = raw.trim();
  
  // หา { ... } block แรกจนถึงตัวสุดท้าย
  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  
  if (braceStart !== -1 && braceEnd !== -1) {
    return raw.slice(braceStart, braceEnd + 1);
  }

  return direct;
}

const SYSTEM_PROMPT = `You are an expert Lemon8 content strategist, viral content creator, and creative AI agent.
Your goal is to analyze past/scraped content AND their performance (Likes), avoid repetition completely, and generate HIGH-QUALITY, VIRAL, and 100% NEW content ideas.

========================
STEP 1: ANALYZE & FIND WINNING PATTERNS
========================
Analyze the provided history/scraped content. Pay special attention to the "Likes" metric.
Extract:
- Main Topics
- Content Formats
- Hook Patterns
- Tone & Style
- High-Performing Insights: What do the posts with the highest likes have in common? What psychological triggers or formats made them viral?

========================
STEP 2: STRICT REPETITION CHECK (CRITICAL)
========================
Identify topics and exact angles that are already used in the provided list.
Define a clear "AVOID LIST". You MUST NOT generate any idea that covers the exact same topic or angle as the provided content.

========================
STEP 3: GENERATE NEW IDEAS
========================
Generate 5 NEW content ideas that:
- Are 100% DIFFERENT from the provided history in terms of topic and core message.
- LEVERAGE the "High-Performing Insights" (e.g., use similar engaging hook structures or aesthetic formats that proved to get high likes, but apply them to completely NEW subjects).
- Fit Lemon8 viral style (relatable, aesthetic, engaging).

========================
STEP 4: ADD CAPTIONS
========================
For EACH idea, generate:
- Title
- Hook
- Content Type
- Angle
- Caption (catchy first line, emoji, short paragraph, 3-5 hashtags)

========================
STEP 5: SCORING
========================
For each idea, score (1-10):
- Creativity
- Virality
- Uniqueness (compared to history)
Then SELECT the BEST 2 ideas by returning their FULL objects.

========================
RULES
========================
- NEVER repeat previous topics.
- APPLY winning patterns from high-liked posts to NEW niches/topics.
- Output MUST BE VALID JSON ONLY without any prefix, suffix, or markdown formatting.

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

const DEFAULT_MODEL = "gemini-3.1-pro-preview";

export async function runIdeaAgent(
  niche: string,
  model: string = DEFAULT_MODEL,
  externalHistory?: ScrapedContent[] 
): Promise<AgentResult | AgentError> {
  ensureDataDir();

  let historyText: string;

  if (externalHistory && externalHistory.length > 0) {
    // 💡 FIX 1: จำกัดเอาแค่ 30 โพสต์ล่าสุด เพื่อป้องกัน Context/Token ล้นจน AI ตัดจบ JSON
    const limitedHistory = externalHistory.slice(0, 30);
    
    historyText = limitedHistory
      .map((c, i) => {
        const parts = [`${i + 1}. Title: "${c.title}"`];
        if (c.description) parts.push(`   Description: ${c.description}`);
        if (c.stats)       parts.push(`   Likes: ${c.stats}`);
        return parts.join("\n");
      })
      .join("\n\n");
  } else {
    const history = loadHistory().slice(-10);
    historyText =
      history.length > 0
        ? JSON.stringify(history, null, 2)
        : "No history yet.";
  }

  const isFromScrape = externalHistory && externalHistory.length > 0;

  const userMessage = `
Niche: ${niche}

${isFromScrape
  ? `CRITICAL: Here is the scraped content from the creator's profile (${externalHistory!.length > 30 ? "Top 30" : externalHistory!.length} posts) along with their Like counts. Analyze the high-liked posts to find winning patterns, but DO NOT suggest any ideas that cover the exact same topics:\n`
  : "Previous content history:\n"}
${historyText}

Analyze all the content above carefully. Discover what drives high engagement, then generate 5 fresh viral content ideas for Lemon8 that are COMPLETELY DIFFERENT in topic from what has already been posted.
`;

  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 100000, 
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      // 💡 เอา response_format ออกไปก่อน เผื่อ API ฝั่ง Proxy ไม่รองรับ
    });

    const raw = response.choices[0]?.message?.content ?? "";
    
    // 💡 สิ่งนี้สำคัญมาก! รบกวนดูใน Terminal ตอนที่มัน Error
    console.log("=== RAW AI RESPONSE START ===");
    console.log(raw);
    console.log("=== RAW AI RESPONSE END ===");

    if (!raw.trim()) {
      return { error: "empty_response", raw: "AI returned empty content" };
    }

    // 💡 เรียกใช้ฟังก์ชันสกัด JSON ที่เราสร้างไว้
    const clean = extractJSON(raw);

    let result: AgentResult;
    try {
      // ลอง Parse ดู
      result = JSON.parse(clean);
    } catch (err) {
      console.error("❌ JSON Parse Failed! The cleaned string was:", clean);
      return { error: "invalid_json", raw: clean };
    }

    if (!result?.ideas || !result?.best_ideas) {
      return { error: "bad_response", raw: clean };
    }

    const newItems: HistoryItem[] = result.best_ideas.map((idea) => ({
      title: idea.title,
      caption: idea.caption,
      type: idea.type,
      date: new Date().toISOString(),
    }));

    saveToHistory(newItems);

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "api_connection_failed";
    console.error("API call error:", message);
    return { error: message };
  }
}


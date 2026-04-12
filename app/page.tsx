"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// ---- Types ----
type Idea = {
  title: string;
  hook: string;
  type: string;
  angle: string;
  caption: string;
  score: { creativity: number; virality: number; uniqueness: number };
};

type TokenUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type AgentResult = {
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

type HistoryEntry = {
  id: string;
  accountId: string;
  generatedAt: string;
  niche: string;
  contentType: string;
  userPrompt: string;
  ideaCount: number;
  result: AgentResult;
};

type ScrapedContent = {
  title: string;
  description?: string;
  stats?: string;
};

type ScrapeResult = {
  profile: { name: string; bio: string };
  total_contents: number;
  contents: ScrapedContent[];
};

// ---- Preset Accounts ----
const ACCOUNTS: {
  id: string;
  label: string;
  username: string;
  url: string;
  avatar: string;
  niche: string;
}[] = [
  {
    id: "acc1",
    label: "@pumppp97",
    username: "@pumppp97",
    url: "https://www.lemon8-app.com/@pumppp97",
    avatar: "https://p16-lemon8-sign-sg.tiktokcdn.com/user-avatar-alisg/ee0a08ee00810715b5e30d066014d58a~tplv-sdweummd6v-shrink:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1778587200&x-signature=6DrRjaYhmWQ0QZ0JFq4BiqdN7g4%3D",
    niche: "lifestyle",
  },
  {
    id: "acc2",
    label: "@ctrllifee",
    username: "@ctrllifee",
    url: "https://www.lemon8-app.com/@ctrllifee",
    avatar: "https://p16-lemon8-sign-sg.tiktokcdn.com/user-avatar-alisg/e4d0c0e114f12314a77a52844d549e4c~tplv-sdweummd6v-shrink:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1778587200&x-signature=C%2FJAG%2F%2BepuCp6eQ0dAQ7%2Fj8%2B6jM%3D",
    niche: "beauty",
  },
  {
    id: "acc3",
    label: "@sha_zfleen",
    username: "@sha_zfleen",
    url: "https://www.lemon8-app.com/@sha_zfleen",
    avatar: "https://p16-lemon8-sign-sg.tiktokcdn.com/user-avatar-alisg/facc20fd0570d54c2e293cd3ef79ae4c~tplv-sdweummd6v-shrink:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1778587200&x-signature=SBFntSLXoY%2FGSBDfx3IOwwnODwg%3D",
    niche: "fashion",
  },
  {
    id: "acc4",
    label: "@_babybunny88",
    username: "@_babybunny88",
    url: "https://www.lemon8-app.com/@_babybunny88",
    avatar: "https://p16-lemon8-sign-sg.tiktokcdn.com/user-avatar-alisg/c271ecdfa64bcc09d469b6a46b82e122~tplv-sdweummd6v-shrink:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1778587200&x-signature=zMDDs1rIhS9%2BBj9mWQWmDNu7SO8%3D",
    niche: "food",
  },
  {
    id: "acc5",
    label: "@tofufu11",
    username: "@tofufu11",
    url: "https://www.lemon8-app.com/@tofufu11",
    avatar: "https://p16-lemon8-sign-sg.tiktokcdn.com/user-avatar-alisg/e1fa7f202e6f72a2f45f7da8e7f680a2~tplv-sdweummd6v-shrink:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1778587200&x-signature=1UIwzSsT5SAZY%2BhOO2BaRugVcR4%3D",
    niche: "travel",
  },
  {
    id: "acc6",
    label: "@winterr597",
    username: "@winterr597",
    url: "https://www.lemon8-app.com/@winterr597",
    avatar: "https://p16-lemon8-sign-sg.tiktokcdn.com/user-avatar-alisg/67558cbb71b623e060ec24baa6b37938~tplv-sdweummd6v-shrink:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1778587200&x-signature=phu67jsZTGCUC58Fth8aqc77bOQ%3D",
    niche: "wellness",
  },
];

const CONTENT_TYPES = [
  { label: "🔥 Viral Hook", value: "viral_hook" },
  { label: "📖 Story / Experience", value: "story" },
  { label: "📋 List / Tips", value: "list_tips" },
  { label: "🎯 Tutorial / How-to", value: "tutorial" },
  { label: "💬 Opinion / Review", value: "opinion" },
  { label: "✨ Aesthetic / Vibe", value: "aesthetic" },
  { label: "❓ Question / Poll", value: "question" },
  { label: "🆚 Compare / Contrast", value: "compare" },
];

// ---- Sub-components ----
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-gray-400 capitalize text-xs">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-700"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-500 text-xs font-mono">{value}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700 whitespace-nowrap"
    >
      {copied ? "✓ Copied!" : "Copy caption"}
    </button>
  );
}

function IdeaCard({ idea, isBest }: { idea: Idea; isBest: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-4 bg-white transition-shadow hover:shadow-md ${
        isBest ? "border-orange-300 shadow-sm" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900 leading-snug text-sm">{idea.title}</h3>
        {isBest && (
          <span className="shrink-0 text-xs px-2.5 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full font-medium">
            ⭐ Top pick
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-600">
          {idea.type}
        </span>
        <span className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-500">
          {idea.angle}
        </span>
      </div>
      <p className="text-sm text-gray-500 italic border-l-2 border-orange-200 pl-3 leading-relaxed">
        "{idea.hook}"
      </p>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{idea.caption}</p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          {Object.entries(idea.score).map(([k, v]) => (
            <ScoreBar key={k} label={k} value={v} />
          ))}
        </div>
        <CopyButton text={idea.caption} />
      </div>
    </div>
  );
}

function HistoryEntryCard({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const bestTitles = new Set(entry.result.best_ideas.map((b) => b.title));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full font-medium">
              {entry.contentType.replace("_", " ")}
            </span>
            <span className="text-xs text-gray-400">
              {entry.result.ideas.length} ideas · {entry.result.best_ideas.length} top picks
            </span>
            {entry.ideaCount && entry.ideaCount !== entry.result.ideas.length && (
              <span className="text-xs text-gray-300">(requested {entry.ideaCount})</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {new Date(entry.generatedAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {entry.userPrompt && (
            <p className="text-xs text-gray-500 truncate italic">"{entry.userPrompt}"</p>
          )}
        </div>
        <span className="text-gray-300 text-xs shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 p-4 flex flex-col gap-4">
          {/* Analysis summary */}
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Analysis</p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Topics:</span> {entry.result.analysis.topics.join(", ")}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Tone:</span> {entry.result.analysis.tone}
            </p>
            {entry.result.analysis.high_performing_insights && (
              <p className="text-xs text-gray-600">
                <span className="font-medium">Insight:</span>{" "}
                {entry.result.analysis.high_performing_insights}
              </p>
            )}
          </div>

          {/* All ideas */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              All {entry.result.ideas.length} ideas
            </p>
            {entry.result.ideas.map((idea) => (
              <IdeaCard key={idea.title} idea={idea} isBest={bestTitles.has(idea.title)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Token Usage Bar Component ----
function TokenUsageBar({
  usage,
  limit,
}: {
  usage: TokenUsage;
  limit: number;
}) {
  const pct = Math.min((usage.total_tokens / limit) * 100, 100);
  const isWarn = pct >= 70;
  const isDanger = pct >= 90;

  const color = isDanger
    ? "from-red-400 to-red-500"
    : isWarn
    ? "from-orange-400 to-amber-400"
    : "from-green-400 to-emerald-400";

  const bgColor = isDanger
    ? "bg-red-50 border-red-100"
    : isWarn
    ? "bg-orange-50 border-orange-100"
    : "bg-green-50 border-green-100";

  const textColor = isDanger ? "text-red-500" : isWarn ? "text-orange-500" : "text-green-600";

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2.5 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Token Usage
          </span>
          {isDanger && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-500 rounded-full font-medium animate-pulse">
              ⚠ ใกล้เต็ม
            </span>
          )}
          {isWarn && !isDanger && (
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-500 rounded-full font-medium">
              ⚡ เฝ้าระวัง
            </span>
          )}
        </div>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Prompt</span>
          <span className="text-xs font-semibold text-gray-700 tabular-nums">
            {usage.prompt_tokens.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Completion</span>
          <span className="text-xs font-semibold text-gray-700 tabular-nums">
            {usage.completion_tokens.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Total / Limit</span>
          <span className={`text-xs font-bold tabular-nums ${textColor}`}>
            {usage.total_tokens.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
      </div>

      {isDanger && (
        <p className="text-xs text-red-400 text-center leading-relaxed">
          Token ใกล้ถึง limit แล้ว — ถ้า gen ต่อ AI อาจตัด JSON กลางคัน
        </p>
      )}
    </div>
  );
}

// ---- Scraped Posts Modal ----
function ScrapedPostsModal({
  contents,
  profileName,
  onClose,
}: {
  contents: ScrapedContent[];
  profileName: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "likes">("default");

  const filtered = contents
    .filter((p) =>
      search.trim() === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy !== "likes") return 0;
      const aNum = parseInt((a.stats ?? "0").replace(/,/g, ""), 10) || 0;
      const bNum = parseInt((b.stats ?? "0").replace(/,/g, ""), 10) || 0;
      return bNum - aNum;
    });

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50 shrink-0">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{profileName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {filtered.length} / {contents.length} posts
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 flex gap-2 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา post..."
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-300 placeholder-gray-300"
          />
          <button
            onClick={() => setSortBy(sortBy === "likes" ? "default" : "likes")}
            className={`shrink-0 px-3 py-2 text-xs rounded-xl border transition-all font-medium ${
              sortBy === "likes"
                ? "bg-orange-50 border-orange-300 text-orange-600"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            ♥ Sort by Likes
          </button>
        </div>

        {/* Posts list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">ไม่พบ post ที่ค้นหา</p>
          ) : (
            filtered.map((post, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex flex-col gap-1.5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
                    {post.title}
                  </p>
                  {post.stats && (
                    <span className="shrink-0 text-xs text-pink-400 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      ♥ {post.stats}
                    </span>
                  )}
                </div>
                {post.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">{post.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
export default function Home() {
  // Account selection
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [view, setView] = useState<"accounts" | "detail">("accounts");

  // Per-account state
  const [scrapeResults, setScrapeResults] = useState<Record<string, ScrapeResult>>({});
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Generate options
  const [niche, setNiche] = useState("lifestyle");
  const [contentType, setContentType] = useState("viral_hook");
  const [userPrompt, setUserPrompt] = useState("");
  const [ideaCount, setIdeaCount] = useState(5);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [tokenLimit, setTokenLimit] = useState<number>(100000);

  // Modal
  const [showScrapedModal, setShowScrapedModal] = useState(false);

  // History per account
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [showHistory, setShowHistory] = useState(false);

  const selectedAccount = ACCOUNTS.find((a) => a.id === selectedAccountId) ?? null;

  useEffect(() => {
    fetchHistory();
  }, []);

  // When switching account, sync niche
  useEffect(() => {
    if (selectedAccount) {
      setNiche(selectedAccount.niche);
      setResult(null);
      setError(null);
      setScrapeError(null);
      setTokenUsage(null);
    }
  }, [selectedAccountId]);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/history");
      const json = await res.json();
      if (json.success) setHistory(json.data);
    } catch {
      /* silent */
    }
  }

  async function handleScrape() {
    if (!selectedAccount) return;
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: selectedAccount.url }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Scrape failed");
      setScrapeResults((prev) => ({ ...prev, [selectedAccount.id]: json }));
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setScraping(false);
    }
  }

  async function handleGenerate() {
    if (!selectedAccount) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const scrapeResult = scrapeResults[selectedAccount.id];
      const body: Record<string, unknown> = {
        niche,
        contentType,
        userPrompt: userPrompt.trim(),
        accountId: selectedAccount.id,
        ideaCount,
      };
      if (scrapeResult) body.scrapedContents = scrapeResult.contents;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Generation failed");
        return;
      }
      setResult(json.data);
      if (json.data.tokenUsage) setTokenUsage(json.data.tokenUsage);
      if (json.tokenLimit) setTokenLimit(json.tokenLimit);
      fetchHistory();
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }

  const currentScrape = selectedAccount ? scrapeResults[selectedAccount.id] : null;
  const currentHistory = selectedAccount ? (history[selectedAccount.id] ?? []) : [];
  const bestTitles = new Set(result?.best_ideas.map((b) => b.title) ?? []);

  // ---- Account List View ----
  if (view === "accounts") {
    return (
      <main className="min-h-screen bg-[#fdf8f5]">
        <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              🍋 Lemon8 Content Agent
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              เลือก Account เพื่อจัดการ Content
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACCOUNTS.map((acc) => {
              const hasScrape = !!scrapeResults[acc.id];
              const histCount = (history[acc.id] ?? []).length;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setView("detail");
                  }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 hover:border-orange-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-300 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    <Image
  src={acc.avatar}
  alt={acc.label}
  width={48}
  height={48}
  className="w-12 h-12 rounded-2xl object-cover"
/>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                      {acc.label}
                    </p>
                    <p className="text-xs text-gray-400">{acc.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-gray-400 capitalize">
                      {acc.niche}
                    </span>
                    {hasScrape && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 border border-green-100 rounded-full text-green-500">
                        ✓ Scraped
                      </span>
                    )}
                    {histCount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-orange-50 border border-orange-100 rounded-full text-orange-400">
                        {histCount} gen
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ---- Account Detail View ----
  return (
    <main className="min-h-screen bg-[#fdf8f5]">
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">

        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView("accounts"); setResult(null); }}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-300 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
  {selectedAccount?.avatar ? (
    <Image
      src={selectedAccount.avatar}
      alt={selectedAccount?.label || ""}
      width={32}
      height={32}
      className="w-8 h-8 rounded-xl object-cover"
    />
  ) : (
    <div className="w-8 h-8 rounded-xl bg-gray-200" />
  )}
</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{selectedAccount?.label}</p>
              <p className="text-xs text-gray-400">{selectedAccount?.username}</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6 shadow-sm">

          {/* Scrape Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Step 1 — Sync Profile Data
              </label>
              {currentScrape && (
                <span className="text-xs text-green-500 font-medium">
                  ✓ {currentScrape.total_contents} posts synced
                </span>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 truncate">
                {selectedAccount?.url}
              </div>
              <button
                onClick={handleScrape}
                disabled={scraping}
                className="shrink-0 px-4 py-2.5 text-sm rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap font-medium"
              >
                {scraping ? "Syncing..." : currentScrape ? "Re-sync" : "Sync Now"}
              </button>
            </div>

            {scrapeError && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {scrapeError}
              </p>
            )}

            {currentScrape && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    {currentScrape.profile.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                      {currentScrape.total_contents} posts
                    </span>
                    <button
                      onClick={() => setShowScrapedModal(true)}
                      className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors border border-orange-200 bg-orange-50 hover:bg-orange-100 px-2.5 py-0.5 rounded-full"
                    >
                      ดูทั้งหมด →
                    </button>
                  </div>
                </div>
                {currentScrape.profile.bio && (
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {currentScrape.profile.bio}
                  </p>
                )}
                {/* Top 5 preview */}
                <div className="flex flex-col gap-1 mt-1">
                  {currentScrape.contents.slice(0, 5).map((post, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-0.5">
                      <p className="text-xs text-gray-600 truncate flex-1">{post.title}</p>
                      {post.stats && (
                        <span className="text-xs text-pink-400 shrink-0 font-medium">♥ {post.stats}</span>
                      )}
                    </div>
                  ))}
                  {currentScrape.contents.length > 5 && (
                    <button
                      onClick={() => setShowScrapedModal(true)}
                      className="text-xs text-gray-400 hover:text-orange-500 transition-colors text-left mt-1"
                    >
                      + {currentScrape.contents.length - 5} posts อีก — กดเพื่อดูทั้งหมด
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-50" />

          {/* Content Type */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Step 2 — ประเภท Content
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setContentType(ct.value)}
                  className={`text-sm px-3 py-2.5 rounded-xl border transition-all text-left ${
                    contentType === ct.value
                      ? "bg-orange-50 border-orange-300 text-orange-700 font-medium"
                      : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-50" />

          {/* Idea Count */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Step 3 — จำนวน Idea ที่ต้องการ
              </label>
              <span className="text-sm font-bold text-orange-500 tabular-nums w-6 text-right">
                {ideaCount}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              value={ideaCount}
              onChange={(e) => setIdeaCount(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-400 bg-gray-100"
            />
            <div className="flex justify-between text-xs text-gray-300 px-0.5">
              {[1, 3, 5, 7, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setIdeaCount(n)}
                  className={`transition-colors ${
                    ideaCount === n ? "text-orange-500 font-semibold" : "hover:text-gray-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-50" />

          {/* Niche */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Step 4 — Niche / หมวดหมู่
            </label>
            <div className="flex flex-wrap gap-2">
              {["lifestyle","beauty","fashion","food","travel","wellness","finance","productivity"].map((n) => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  className={`text-sm px-3.5 py-1.5 rounded-full border capitalize transition-all ${
                    niche === n
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-50" />

          {/* User Prompt */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Step 5 — เพิ่ม Prompt (ไม่บังคับ)
              </label>
              <span className="text-xs text-gray-300">Optional</span>
            </div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="เช่น: อยากให้เน้นกลุ่มคนวัยทำงาน, ใส่ trend ช่วงหน้าร้อน, ให้ดูมีความเป็นไทย..."
              rows={3}
              className="w-full text-sm px-3.5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-300 placeholder-gray-300 text-gray-800 resize-none leading-relaxed"
            />
          </div>

          <div className="border-t border-gray-50" />

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loading
              ? "กำลังคิด Idea..."
              : currentScrape
              ? `✨ Generate จาก ${currentScrape.profile.name}`
              : "✨ Generate Content Ideas"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3 animate-pulse"
              >
                <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                <div className="h-20 bg-gray-50 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Analysis
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Topics", value: result.analysis.topics.join(", ") },
                  { label: "Formats", value: result.analysis.formats.join(", ") },
                  { label: "Hooks", value: result.analysis.hooks.join(", ") },
                  { label: "Tone", value: result.analysis.tone },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm text-gray-700">{item.value}</p>
                  </div>
                ))}
              </div>
              {result.analysis.high_performing_insights && (
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-xs text-gray-400 font-medium mb-1">High-performing insights</p>
                  <p className="text-sm text-gray-600">{result.analysis.high_performing_insights}</p>
                </div>
              )}
              <div className="pt-2 border-t border-gray-50 flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 self-center">Avoid:</span>
                {result.avoid.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-red-50 text-red-400 border border-red-100 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {result.ideas.length} Ideas ใหม่
              </p>
              {result.ideas.map((idea) => (
                <IdeaCard
                  key={idea.title}
                  idea={idea}
                  isBest={bestTitles.has(idea.title)}
                />
              ))}
            </div>

            {/* Token Usage — shown after generation */}
            {tokenUsage && (
              <TokenUsageBar usage={tokenUsage} limit={tokenLimit} />
            )}
          </div>
        )}

        {/* History for this account */}
        <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <span className="font-medium">
              History ของ {selectedAccount?.label} ({currentHistory.length} ครั้ง)
            </span>
            <span className="text-xs">{showHistory ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showHistory && (
            <div className="flex flex-col gap-3">
              {currentHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  ยังไม่มี History สำหรับ Account นี้
                </p>
              ) : (
                [...currentHistory]
                  .reverse()
                  .map((entry) => <HistoryEntryCard key={entry.id} entry={entry} />)
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scraped Posts Modal */}
      {showScrapedModal && currentScrape && (
        <ScrapedPostsModal
          contents={currentScrape.contents}
          profileName={currentScrape.profile.name}
          onClose={() => setShowScrapedModal(false)}
        />
      )}
    </main>
  );
}
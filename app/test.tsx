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

"use client";

import { useEffect, useRef, useState } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { id: "acc1", label: "@pumppp97",     niche: "lifestyle", emoji: "🌸", gens: 3, verified: true  },
  { id: "acc2", label: "@ctrllifee",    niche: "beauty",    emoji: "💄", gens: 5, verified: true  },
  { id: "acc3", label: "@sha_zfleen",   niche: "fashion",   emoji: "👗", gens: 2, verified: false },
  { id: "acc4", label: "@_babybunny88", niche: "food",      emoji: "🍜", gens: 7, verified: true  },
  { id: "acc5", label: "@tofufu11",     niche: "travel",    emoji: "✈️", gens: 4, verified: false },
  { id: "acc6", label: "@winterr597",   niche: "wellness",  emoji: "🧘", gens: 1, verified: false },
];

const POLAROID_DATA = [
  { emoji: "💑",   caption: "Forever Us 💕",  tape: "#ffb3c6", rotate: -4 },
  { emoji: "👯‍♀️", caption: "Best Friends!",  tape: "#b3d9ff", rotate:  3 },
  { emoji: "👰💍", caption: "She Said Yes!",  tape: "#c8f5c8", rotate: -2 },
  { emoji: "🤪",   caption: "Goofballs 😂",   tape: "#ffe4b3", rotate:  5 },
];

const VIDEO_SCENES = [
  { bg: "linear-gradient(160deg,#ff9a56,#ffad7e,#ffd6a8)", emoji: "💃🕺" },
  { bg: "linear-gradient(160deg,#ff7e8e,#ffa0b0,#ffd6df)", emoji: "💑✨" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function triggerFlash() {
  const flash = document.createElement("div");
  Object.assign(flash.style, {
    position: "fixed", inset: "0",
    background: "rgba(255,230,240,0.6)",
    zIndex: "9999", pointerEvents: "none",
    animation: "flashIn 0.4s ease forwards",
  });
  if (!document.getElementById("flashStyle")) {
    const s = document.createElement("style");
    s.id = "flashStyle";
    s.textContent = "@keyframes flashIn{0%{opacity:1}100%{opacity:0}}";
    document.head.appendChild(s);
  }
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 450);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Page() {
  const accountsGridRef = useRef<HTMLDivElement>(null);
  const photoPanelInnerRef = useRef<HTMLDivElement>(null);
  const boothScene1Ref = useRef<HTMLDivElement>(null);
  const boothWrap1Ref = useRef<HTMLDivElement>(null);

  // ── Modal / unlock state ─────────────────────────────────────────────────
  const CORRECT_CODE  = "1234";           // ← เปลี่ยนรหัสที่นี่
  const STORAGE_KEY   = "booth_unlocked"; // key ใน localStorage
  const TTL_MS        = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

  const [showModal, setShowModal] = useState(false);
  const [passcode, setPasscode]   = useState("");
  const [shake, setShake]         = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // ตรวจสอบ localStorage ตอน mount — ถ้า unlock แล้วและไม่หมดอายุ ข้ามหน้ากรอกรหัสได้เลย
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw) as { ts: number };
        if (Date.now() - ts < TTL_MS) {
          setIsUnlocked(true);
          return;
        }
      }
    } catch { /* ignore */ }
  }, []);

  function openModal() {
    setPasscode("");
    setError("");
    setSuccess(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setPasscode("");
    setError("");
  }

  function handlePasscodeInput(key: string) {
    if (key === "⌫") {
      setPasscode((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (passcode.length >= 4) return;
    const next = passcode + key;
    setPasscode(next);
    setError("");
    if (next.length === 4) {
      if (next === CORRECT_CODE) {
        setSuccess(true);
        // บันทึก timestamp ลง localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
        } catch { /* ignore */ }
        setTimeout(() => {
          setIsUnlocked(true);
          setShowModal(false);
          setSuccess(false);
          setPasscode("");
        }, 800);
      } else {
        setError("รหัสไม่ถูกต้อง ลองอีกครั้งนะคะ 💔");
        setShake(true);
        setTimeout(() => { setShake(false); setPasscode(""); }, 600);
      }
    }
  }

  // ── Background / Confetti ────────────────────────────────────────────────
  useEffect(() => {
    const bokehEl = document.getElementById("bokeh");
    const bokehColors = ["#ffd6e0","#ffe4b5","#e8d5f5","#d4eeff","#d4f5e9","#ffb3c6"];
    if (bokehEl) {
      for (let i = 0; i < 28; i++) {
        const d = document.createElement("div");
        d.className = "bokeh-dot";
        const sz = 10 + Math.random() * 30;
        Object.assign(d.style, {
          left:              `${Math.random() * 100}%`,
          top:               `${100 + Math.random() * 30}%`,
          width:             `${sz}px`,
          height:            `${sz}px`,
          background:        bokehColors[Math.floor(Math.random() * bokehColors.length)],
          animationDuration: `${8 + Math.random() * 14}s`,
          animationDelay:    `${Math.random() * 12}s`,
        });
        bokehEl.appendChild(d);
      }
    }

    const confEl = document.getElementById("confetti");
    const confs  = ["💕","⭐","✨","💛","🌸","💗","🌟","💖"];
    if (confEl) {
      for (let i = 0; i < 18; i++) {
        const c = document.createElement("div");
        c.className   = "conf-item";
        c.textContent = confs[Math.floor(Math.random() * confs.length)];
        Object.assign(c.style, {
          left:              `${Math.random() * 100}%`,
          animationDuration: `${10 + Math.random() * 15}s`,
          animationDelay:    `${Math.random() * 14}s`,
          fontSize:          `${0.8 + Math.random() * 0.8}rem`,
        });
        confEl.appendChild(c);
      }
    }

    return () => {
      if (bokehEl)  bokehEl.innerHTML  = "";
      if (confEl)   confEl.innerHTML   = "";
    };
  }, []);

  // ── Hero Booth ───────────────────────────────────────────────────────────
  useEffect(() => {
    let playing1 = true;

    const playBtn1  = document.getElementById("playBtn1");
    const playIcon1 = document.getElementById("playIcon1");
    const startBtn1 = document.getElementById("startBtn1");
    const boothWrap1 = boothWrap1Ref.current;

    const handlePlay = () => {
      playing1 = !playing1;
      if (playIcon1) {
        playIcon1.style.cssText = playing1
          ? "width:0;height:0;border-style:solid;border-width:4px 0 4px 7px;border-color:transparent transparent transparent #fff;"
          : "width:8px;height:10px;background:#fff;border-radius:1px;box-shadow:3px 0 0 #fff;";
      }
    };
    playBtn1?.addEventListener("click", handlePlay);

    const handleCoin = () => {
      const boothBody = document.querySelector<HTMLElement>("#boothScene1 .booth-body");
      if (boothBody) {
        boothBody.style.transition = "transform 0.1s";
        boothBody.style.transform  = "scale(0.97)";
        setTimeout(() => { boothBody.style.transform = ""; }, 150);
      }
      triggerFlash();
    };
    startBtn1?.addEventListener("click", handleCoin);

    const handleScroll = () => {
      const sy = window.scrollY;
      if (boothWrap1 && sy < window.innerHeight) {
        const tilt = Math.min(sy * 0.02, 8);
        boothWrap1.style.transform =
          `rotateY(${tilt - 4}deg) rotateX(${1 - tilt * 0.2}deg) translateY(${sy * 0.08}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      playBtn1?.removeEventListener("click", handlePlay);
      startBtn1?.removeEventListener("click", handleCoin);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ── Zoom Booth ───────────────────────────────────────────────────────────
  useEffect(() => {
    let currentZoom: string | null = null;
    let videoPlaying = true;
    let videoFrame   = 0;
    let videoTimer: ReturnType<typeof setInterval> | null = null;
    let isMobile     = window.innerWidth < 768;

    const onResize = () => {
      isMobile = window.innerWidth < 768;
      // recalculate zoom ถ้ากำลัง zoom อยู่
      if (currentZoom) applyZoom();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const boothEl       = document.getElementById("boothInteractive");
    const backdrop      = document.getElementById("zoomBackdrop");
    const backBtn       = document.getElementById("backBtn");
    const dock          = document.getElementById("zoomDock");
    const badges        = document.querySelectorAll<HTMLElement>(".hint-badge-new");
    const panelScreen   = document.getElementById("panel-screen");
    const panelPhotos   = document.getElementById("panel-photos");
    const panelControls = document.getElementById("panel-controls");
    const videoScene    = document.getElementById("videoScene");
    const videoEmoji    = document.getElementById("videoEmoji");
    const videoOverlay  = document.getElementById("videoControlsOverlay");
    const videoPlayBtn  = document.getElementById("videoPlayBtn");
    const progressBar   = document.getElementById("progressBar");
    const polaroidPreview = document.getElementById("polaroidPreview");

    // Build polaroid cards
    if (photoPanelInnerRef.current) {
      POLAROID_DATA.forEach((p) => {
        const inner = photoPanelInnerRef.current!;
        inner.appendChild(buildPolaroidCard(p));
      });
    }

    function buildPolaroidCard(p: typeof POLAROID_DATA[0]) {
      const wrap = document.createElement("div");
      Object.assign(wrap.style, {
        background: "#fffdf9", borderRadius: "4px",
        padding: "8px 8px 24px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06)",
        transform: `rotate(${p.rotate}deg)`,
        position: "relative", width: "110px", flexShrink: "0",
        border: "1px solid rgba(0,0,0,0.05)",
      });
      const tape = document.createElement("div");
      Object.assign(tape.style, {
        position: "absolute", top: "-8px", left: "50%",
        transform: "translateX(-50%) rotate(-2deg)",
        width: "36px", height: "16px",
        background: p.tape, opacity: "0.8",
        borderRadius: "3px", zIndex: "2",
      });
      const photo = document.createElement("div");
      Object.assign(photo.style, {
        background: "linear-gradient(135deg,#ffe4ee 0%,#ffd6e8 100%)",
        borderRadius: "2px", height: "90px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "42px",
      });
      photo.textContent = p.emoji;
      const cap = document.createElement("p");
      Object.assign(cap.style, {
        fontFamily: "'Caveat',cursive,'Sarabun',sans-serif",
        fontSize: "12px", color: "#7a3450",
        textAlign: "center", marginTop: "8px",
        lineHeight: "1.2", fontWeight: "600",
      });
      cap.textContent = p.caption;
      wrap.append(tape, photo, cap);
      return wrap;
    }

    function startVideo() {
      if (videoTimer) clearInterval(videoTimer);
      videoTimer = setInterval(() => {
        videoFrame = (videoFrame + 1) % VIDEO_SCENES.length;
        applyVideoFrame();
        if (progressBar) {
          progressBar.style.width = "0%";
          requestAnimationFrame(() => { progressBar.style.width = "100%"; });
        }
      }, 2000);
    }
    function stopVideo() {
      if (videoTimer) { clearInterval(videoTimer); videoTimer = null; }
    }
    function applyVideoFrame() {
      const s = VIDEO_SCENES[videoFrame];
      if (videoScene) videoScene.style.background = s.bg;
      if (videoEmoji) videoEmoji.textContent       = s.emoji;
    }
    startVideo();

    const handleVideoPlay = (e: Event) => {
      e.stopPropagation();
      videoPlaying = !videoPlaying;
      if (videoPlayBtn) videoPlayBtn.textContent = videoPlaying ? "⏸" : "▶";
      if (videoPlaying) {
        startVideo();
        videoEmoji?.classList.remove("video-paused");
      } else {
        stopVideo();
        videoEmoji?.classList.add("video-paused");
      }
    };
    videoPlayBtn?.addEventListener("click", handleVideoPlay);

    const ZOOM_CFG: Record<string, {
      svgX: number; svgY: number;
      scaleD: number; scaleM: number;
    }> = {
      // Screen (วิดีโอ): rect x=98 y=122 w=186 h=200 → center (191, 222)
      screen:   { svgX: 191, svgY: 222, scaleD: 3.0, scaleM: 2.2 },
      // Photo slot: rect x=112 y=345 w=158 h=80 → center (191, 385)
      photos:   { svgX: 191, svgY: 385, scaleD: 2.6, scaleM: 2.0 },
      // Controls: rect x=308 y=130 w=52 h=200 → center (334, 230)
      controls: { svgX: 334, svgY: 230, scaleD: 3.2, scaleM: 2.4 },
    };

    function handleZoom(section: string) {
      if (section === currentZoom) return;
      currentZoom = section;
      applyZoom();
    }
    (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom = handleZoom;

    function applyZoom() {
      const isZoomed = currentZoom !== null;
      const zoomTarget = currentZoom; // capture ก่อน setTimeout

      backdrop?.classList.toggle("active", isZoomed);
      backBtn?.classList.toggle("show", isZoomed);
      dock?.classList.toggle("hide", isZoomed);
      badges.forEach((b) => b.classList.toggle("hide", isZoomed));
      [panelScreen, panelPhotos, panelControls].forEach((p) => p?.classList.remove("show"));
      videoOverlay?.classList.remove("show");
      if (polaroidPreview) polaroidPreview.style.opacity = "1";

      // lock/unlock horizontal scroll
      document.body.style.overflowX = isZoomed ? "hidden" : "";
      document.documentElement.style.overflowX = isZoomed ? "hidden" : "";

      if (!isZoomed) {
        if (boothEl) {
          boothEl.style.transform       = "";
          boothEl.style.transformOrigin = "50% 50%";
        }
        return;
      }

      const cfg   = ZOOM_CFG[zoomTarget!];
      const scale = isMobile ? cfg.scaleM : cfg.scaleD;

      if (boothEl) {
        const rect = boothEl.getBoundingClientRect();
        const elW  = rect.width;
        const elH  = rect.height;

        const originXpx  = (cfg.svgX / 400) * elW;
        const originYpx  = (cfg.svgY / 580) * elH;
        const originXpct = (originXpx / elW) * 100;
        const originYpct = (originYpx / elH) * 100;

        const vpCX = window.innerWidth  / 2;
        const vpCY = window.innerHeight / 2;

        const originVpX = rect.left + originXpx;
        const originVpY = rect.top  + originYpx;

        const txPx = vpCX - originVpX;
        const tyPx = vpCY - originVpY;

        boothEl.style.transformOrigin = `${originXpct}% ${originYpct}%`;
        boothEl.style.transform = `scale(${scale}) translate(${txPx / scale}px, ${tyPx / scale}px)`;
      }

      // ใช้ zoomTarget แทน currentZoom เพื่อป้องกัน race condition
      setTimeout(() => {
        if (zoomTarget === "screen") {
          panelScreen?.classList.add("show");
          videoOverlay?.classList.add("show");
        } else if (zoomTarget === "photos") {
          panelPhotos?.classList.add("show");
          if (polaroidPreview) polaroidPreview.style.opacity = "0";
        } else if (zoomTarget === "controls") {
          panelControls?.classList.add("show");
        }
      }, 320);
    }

    const zoneScreen   = document.getElementById("zone-screen");
    const zoneControls = document.getElementById("zone-controls");
    const zonePhotos   = document.getElementById("zone-photos");

    const onZoneScreen   = () => { if (!currentZoom) handleZoom("screen");   };
    const onZoneControls = () => { if (!currentZoom) handleZoom("controls"); };
    const onZonePhotos   = () => { if (!currentZoom) handleZoom("photos");   };
    const onBack         = () => { currentZoom = null; applyZoom(); };

    zoneScreen?.addEventListener("click", onZoneScreen);
    zoneControls?.addEventListener("click", onZoneControls);
    zonePhotos?.addEventListener("click", onZonePhotos);
    backBtn?.addEventListener("click", onBack);
    backdrop?.addEventListener("click", onBack);

    return () => {
      stopVideo();
      window.removeEventListener("resize", onResize);
      videoPlayBtn?.removeEventListener("click", handleVideoPlay);
      zoneScreen?.removeEventListener("click", onZoneScreen);
      zoneControls?.removeEventListener("click", onZoneControls);
      zonePhotos?.removeEventListener("click", onZonePhotos);
      backBtn?.removeEventListener("click", onBack);
      backdrop?.removeEventListener("click", onBack);
      // cleanup scroll lock
      document.body.style.overflowX = "";
      document.documentElement.style.overflowX = "";
    };
  }, []);

  // ── Accounts ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const grid = accountsGridRef.current;
    if (!grid) return;
    ACCOUNTS.forEach((acc, i) => {
      const card = document.createElement("div");
      card.className = "account-card reveal";
      card.style.transitionDelay = `${i * 0.08}s`;
      card.innerHTML = `
        <div class="acc-avatar" style="position:relative;">
          <span>${acc.emoji}</span>
          ${acc.verified ? '<div class="acc-badge">✓</div>' : ""}
        </div>
        <div class="acc-name">${acc.label}</div>
        <div class="acc-niche"><span>${acc.emoji}</span> ${acc.niche}</div>
        ${acc.gens > 0 ? `<div class="acc-gen-count">${acc.gens} gen</div>` : ""}
      `;
      card.addEventListener("click", () => {
        card.style.transform = "scale(0.95) translateY(-2px)";
        setTimeout(() => { card.style.transform = ""; }, 150);
      });
      grid.appendChild(card);
    });
    return () => { if (grid) grid.innerHTML = ""; };
  }, []);

  // ── Scroll Reveal ─────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("vis"); }); },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal, .story-step, .section-label, .account-card")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── Photo Hover ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".photo-card").forEach((card) => {
      const baseRot = card.getAttribute("data-rot") || "0deg";
      const onMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);
        const dy   = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `rotate(0deg) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) scale(1.04)`;
      };
      const onLeave = () => { card.style.transform = `rotate(${baseRot}) scale(1)`; };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });
  }, []);

  // ── Particles ────────────────────────────────────────────────────────────
  useEffect(() => {
    const zoomSection = document.querySelector<HTMLElement>(".zoom-section");
    if (!zoomSection) return;
    const colors = ["#ffb3c6","#ffd6e0","#ffc9a0","#d4b0ff","#b0e0ff"];
    const particles: HTMLElement[] = [];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      const sz = 4 + (i % 4) * 3;
      Object.assign(p.style, {
        position:       "absolute",
        borderRadius:   "50%",
        opacity:        "0.5",
        pointerEvents:  "none",
        left:           `${(i * 5.8 + Math.sin(i) * 10 + 5) % 95}%`,
        top:            `${(i * 4.7 + Math.cos(i) * 8  + 5) % 90}%`,
        width:          `${sz}px`,
        height:         `${sz}px`,
        background:     colors[i % 5],
        animation:      `confettiFall ${6 + i * 0.4}s ease-in-out infinite`,
        animationDelay: `${i * 0.4}s`,
      });
      zoomSection.appendChild(p);
      particles.push(p);
    }
    return () => { particles.forEach((p) => p.remove()); };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --cream: #fff8f0;
          --blush: #ffd6e0;
          --blush-deep: #ffb3c6;
          --rose: #ff85a1;
          --rose-dark: #e05c7a;
          --gold: #ffd89b;
          --gold-deep: #f5c062;
          --gold-rose: #e8a598;
          --lavender: #e8d5f5;
          --sky: #d4eeff;
          --mint: #d4f5e9;
          --text-dark: #3d2235;
          --text-mid: #7a4060;
          --text-light: #b06080;
        }

        html { overflow-x: hidden; scroll-behavior: smooth; }

        body {
          font-family: 'Nunito', 'Sarabun', sans-serif;
          background: var(--cream);
          color: var(--text-dark);
          overflow-x: hidden;
          overflow-y: auto;
          min-height: 100vh;
        }

        .bokeh-layer {
          position: fixed; inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .bokeh-dot {
          position: absolute;
          border-radius: 50%;
          opacity: 0.35;
          animation: floatBokeh linear infinite;
          filter: blur(2px);
        }
        @keyframes floatBokeh {
          0%   { transform: translateY(0) scale(1); opacity: 0.2; }
          50%  { opacity: 0.5; }
          100% { transform: translateY(-110vh) scale(1.3); opacity: 0; }
        }

        .confetti-layer {
          position: fixed; inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .conf-item {
          position: absolute;
          animation: confettiFall linear infinite;
          opacity: 0;
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }

        .hero {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem 4rem;
          text-align: center;
        }

        .hero-tag {
          display: inline-block;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          color: var(--text-dark);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 0.4rem 1.2rem;
          border-radius: 999px;
          margin-bottom: 1.5rem;
          animation: fadeDown 0.8s ease both;
        }

        .hero-title {
          font-family: 'Pacifico', cursive;
          font-size: clamp(2.2rem, 7vw, 4.5rem);
          line-height: 1.15;
          color: var(--text-dark);
          margin-bottom: 0.75rem;
          animation: fadeDown 0.9s 0.1s ease both;
          text-shadow: 3px 4px 0 rgba(255,133,161,0.25);
        }
        .hero-title span { color: var(--rose); }

        .hero-sub {
          font-family: 'Caveat', cursive;
          font-size: clamp(1.1rem, 3vw, 1.6rem);
          color: var(--text-mid);
          margin-bottom: 3rem;
          animation: fadeDown 1s 0.2s ease both;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .booth-scene {
          position: relative;
          width: min(340px, 90vw);
          margin: 0 auto;
          perspective: 1000px;
        }

        .booth-wrap {
          transform-style: preserve-3d;
          animation: boothFloat 4s ease-in-out infinite;
        }
        @keyframes boothFloat {
          0%,100% { transform: rotateY(-3deg) rotateX(1deg) translateY(0px); }
          50%      { transform: rotateY(3deg)  rotateX(-1deg) translateY(-12px); }
        }

        .booth-body {
          background: linear-gradient(160deg, #fff0f5 0%, #ffd6e0 50%, #ffe4b5 100%);
          border-radius: 32px 32px 24px 24px;
          border: 4px solid var(--gold-rose);
          box-shadow:
            0 0 0 8px rgba(255,181,196,0.2),
            0 24px 60px rgba(224,92,122,0.22),
            inset 0 2px 8px rgba(255,255,255,0.6);
          padding: 1.25rem 1.25rem 1.5rem;
          position: relative;
        }

        .booth-deco {
          position: absolute;
          font-size: 1.1rem;
          pointer-events: none;
          animation: decoSpin 6s ease-in-out infinite;
        }
        @keyframes decoSpin {
          0%,100% { transform: scale(1) rotate(-8deg); }
          50%      { transform: scale(1.15) rotate(8deg); }
        }

        .booth-flash { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; }
        .flash-heart {
          font-size: 1.4rem;
          filter: drop-shadow(0 0 6px rgba(255,133,161,0.7));
          animation: flashPulse 1.2s ease-in-out infinite;
        }
        .flash-heart:nth-child(2) { animation-delay: 0.2s; font-size: 1.8rem; }
        .flash-heart:nth-child(3) { animation-delay: 0.4s; }
        @keyframes flashPulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.25); filter: drop-shadow(0 0 14px rgba(255,133,161,0.95)); }
        }

        .booth-brand {
          font-family: 'Pacifico', cursive;
          font-size: 0.95rem;
          color: var(--rose-dark);
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .screen-frame {
          background: linear-gradient(135deg, #2d1b2e, #1a0a1e);
          border-radius: 16px;
          border: 3px solid var(--gold-deep);
          box-shadow:
            0 0 0 3px rgba(245,192,98,0.3),
            inset 0 0 20px rgba(255,133,161,0.15);
          overflow: hidden;
          position: relative;
          aspect-ratio: 4/3;
        }

        .cartoon-scene {
          width: 100%; height: 100%;
          background: linear-gradient(180deg,
            #1a3a6b 0%, #2d6a9f 40%, #e8a070 70%, #f4c07a 100%);
          position: relative; overflow: hidden;
        }
        .scene-sun {
          position: absolute; bottom: 32%; right: 15%;
          width: 48px; height: 48px;
          background: radial-gradient(circle, #ffe082, #ffb300);
          border-radius: 50%;
          animation: sunPulse 3s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(255,200,50,0.6);
        }
        @keyframes sunPulse {
          0%,100% { box-shadow: 0 0 20px rgba(255,200,50,0.6); }
          50%      { box-shadow: 0 0 40px rgba(255,200,50,0.9); }
        }
        .scene-sea {
          position: absolute; bottom: 0; left: 0; right: 0; height: 35%;
          background: linear-gradient(180deg, #3ea8e0, #1565a0);
          border-radius: 60% 60% 0 0 / 20% 20% 0 0;
          animation: waveRock 2.5s ease-in-out infinite;
        }
        @keyframes waveRock {
          0%,100% { transform: scaleX(1) translateY(0); }
          50%      { transform: scaleX(1.02) translateY(-4px); }
        }
        .couple {
          position: absolute; bottom: 32%; left: 50%;
          transform: translateX(-50%);
          display: flex; gap: 8px; align-items: flex-end;
        }
        .figure {
          display: flex; flex-direction: column; align-items: center;
          animation: figureSway 3s ease-in-out infinite;
        }
        .figure:last-child { animation-delay: 0.3s; }
        @keyframes figureSway {
          0%,100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg); }
        }
        .fig-head {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.5);
          position: relative;
        }
        .fig-body { width: 16px; height: 26px; border-radius: 6px 6px 2px 2px; margin-top: 2px; }
        .fig1 .fig-head { background: #ffc5a0; }
        .fig1 .fig-body { background: #ff6b9d; }
        .fig2 .fig-head { background: #ffe0b2; }
        .fig2 .fig-body { background: #5b8af5; }
        .heart-pop {
          position: absolute; top: -16px; left: 50%;
          transform: translateX(-50%);
          font-size: 14px;
          animation: heartPopUp 1.5s ease-in-out infinite;
        }
        @keyframes heartPopUp {
          0%   { transform: translateX(-50%) translateY(0) scale(0.8); opacity: 0; }
          40%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.2); }
          100% { transform: translateX(-50%) translateY(-22px) scale(0.6); opacity: 0; }
        }
        .scene-star {
          position: absolute; width: 4px; height: 4px;
          background: #fffde7; border-radius: 50%;
          animation: twinkle 1.5s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1; transform: scale(1.3); }
        }

        .screen-controls {
          position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 8px; align-items: center;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          border-radius: 999px; padding: 4px 12px;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .ctrl-btn {
          width: 20px; height: 20px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: #fff;
          transition: background 0.2s, transform 0.1s;
        }
        .ctrl-btn:hover { background: rgba(255,133,161,0.5); transform: scale(1.15); }
        .ctrl-play-icon {
          width: 0; height: 0;
          border-style: solid;
          border-width: 4px 0 4px 7px;
          border-color: transparent transparent transparent #fff;
        }

        .booth-stars {
          display: flex; justify-content: space-between;
          padding: 0.4rem 0.2rem; font-size: 0.75rem;
        }
        .booth-slot { text-align: center; margin-top: 0.75rem; }
        .coin-insert {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(255,255,255,0.6);
          border: 2px dashed var(--gold-rose);
          border-radius: 999px; padding: 0.4rem 1rem;
          font-size: 0.7rem; font-weight: 800; color: var(--text-mid);
          cursor: pointer; transition: all 0.2s;
          animation: coinPulse 2s ease-in-out infinite;
        }
        @keyframes coinPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(229,160,152,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(229,160,152,0); }
        }
        .spatial-label {
          position: absolute;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,181,196,0.6);
          border-radius: 999px; padding: 0.4rem 1rem;
          font-size: 0.7rem; font-weight: 700; color: var(--text-mid);
          letter-spacing: 0.06em; white-space: nowrap; pointer-events: none;
          box-shadow: 0 4px 16px rgba(255,133,161,0.15);
          animation: labelFloat 3s ease-in-out infinite;
        }
        @keyframes labelFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }

        .scroll-hint {
          position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
          font-family: 'Caveat', cursive; font-size: 0.95rem; color: var(--text-light);
          animation: fadeDown 1.2s 0.6s ease both;
        }
        .scroll-arrow { animation: bounce 1.5s ease-in-out infinite; }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }

        .zoom-section {
          position: relative;
          z-index: 1;
          min-height: 125vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: linear-gradient(160deg, #fff5f0 0%, #fde8f4 50%, #f0e8ff 100%);
          overflow: hidden; /* ป้องกัน SVG ล้นแนวนอน */
        }

        .zoom-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }
        .zoom-header-tag {
          display: inline-block;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          color: var(--text-dark);
          font-size: 0.75rem; font-weight: 800;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 0.4rem 1.2rem; border-radius: 999px;
          margin-bottom: 1rem;
        }

        .zoom-canvas {
          position: relative;
          width: min(420px, 88vw);
          aspect-ratio: 400 / 580;
          /* ไม่ใส่ max-height เพราะจะทำให้ aspect-ratio พัง */
          margin: 0 auto;
        }

        .zoom-backdrop {
          position: fixed; inset: 0;
          z-index: 200;
          background: rgba(20,5,10,0.65);
          backdrop-filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .zoom-backdrop.active {
          opacity: 1;
          pointer-events: all;
        }

        .booth-interactive {
          position: relative;
          width: 100%; height: 100%;
          transition: transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1),
                      transform-origin 0.3s ease;
          transform-origin: 50% 50%;
          z-index: 210;
        }

        .zone {
          position: absolute;
          cursor: pointer;
          border-radius: 12px;
          transition: background 0.2s;
          z-index: 220;
        }
        .zone:hover:not(.is-zoomed) {
          background: rgba(255,181,196,0.15);
          outline: 2px dashed rgba(255,133,161,0.4);
        }

        .booth-svg { width: 100%; height: 100%; overflow: visible; }

        .video-zone-content {
          width: 100%; height: 100%;
          border-radius: 8px; overflow: hidden;
          position: relative;
        }
        .video-scene {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          transition: background 1.5s ease;
          position: relative;
        }
        .video-emoji {
          font-size: clamp(2rem, 8cqw, 3rem);
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.2));
          animation: scenePulse 2s infinite;
        }
        @keyframes scenePulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        .video-paused .video-emoji { animation: none; }

        .video-controls-overlay {
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          width: 90%;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(10px);
          border-radius: 8px; padding: 6px 10px;
          border: 0.5px solid rgba(255,255,255,0.4);
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s 0.3s;
        }
        .video-controls-overlay.show { opacity: 1; pointer-events: all; }

        .polaroid-strip-preview {
          width: 32%; height: 80%;
          background: #f9f0f4;
          transform: rotate(-2deg);
          border: 1px solid rgba(200,150,160,0.3);
          display: flex; flex-direction: column; gap: 3px; padding: 4px;
          border-radius: 2px; transition: opacity 0.2s;
        }
        .polaroid-strip-preview div { flex: 1; background: #ffe4ee; border-radius: 1px; }

        .hint-badge-new {
          position: absolute;
          background: rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,210,220,0.6);
          border-radius: 999px; padding: 4px 12px;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 4px 12px rgba(220,100,120,0.15);
          white-space: nowrap; cursor: pointer;
          font-family: 'Sarabun', sans-serif;
          font-size: 11px; font-weight: 600; color: #7a3450;
          z-index: 230;
          transition: background 0.2s, transform 0.2s, opacity 0.3s;
          animation: badgeFloat 3s ease-in-out infinite;
        }
        .hint-badge-new:hover {
          background: rgba(255,255,255,0.7);
          transform: translate(-50%, -50%) scale(1.05) !important;
        }
        .hint-badge-new.hide { opacity: 0; pointer-events: none; }

        @keyframes badgeFloat {
          0%,100% { transform: translate(-50%,-50%) translateY(0); }
          50%      { transform: translate(-50%,-50%) translateY(-4px); }
        }

        .info-panel {
          position: fixed;
          z-index: 300;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s 0.35s, transform 0.3s 0.35s;
        }
        .info-panel.show { opacity: 1; pointer-events: all; }

        .info-panel-inner {
          background: rgba(255,255,255,0.28);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px; padding: 20px 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }

        #panel-screen {
          bottom: 8vh; left: 50%; transform: translateX(-50%) translateY(10px);
          text-align: center;
        }
        #panel-screen.show { transform: translateX(-50%) translateY(0); }

        #panel-photos {
          bottom: 3vh; left: 50%;
          transform: translateX(-50%) translateY(20px);
          width: min(560px, 96vw);
          max-height: 45vh;
        }
        #panel-photos.show { transform: translateX(-50%) translateY(0); }

        .panel-photos-inner {
          display: flex;
          gap: 10px;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 12px 16px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .panel-photos-inner::-webkit-scrollbar { display: none; }

        #panel-controls {
          top: 50%; right: 6vw;
          transform: translateY(-50%) translateX(20px);
          width: min(340px, 90vw);
        }
        #panel-controls.show { transform: translateY(-50%) translateX(0); }

        @media (max-width: 767px) {
          #panel-controls {
            top: auto; right: auto; left: 5vw;
            width: 90vw; bottom: 4vh;
            transform: translateY(20px);
          }
          #panel-controls.show { transform: translateY(0); }
        }

        .ctrl-item {
          display: flex; align-items: center; gap: 14px;
          padding: 12px; margin-bottom: 8px;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 12px; cursor: pointer; width: 100%;
          font-family: 'Sarabun', sans-serif; text-align: left;
          transition: background 0.2s;
        }
        .ctrl-item:hover { background: rgba(255,255,255,0.75); }
        .ctrl-item:last-child { margin-bottom: 0; }

        .back-btn {
          position: fixed; top: 20px; left: 20px; z-index: 350;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 999px; padding: 8px 18px;
          cursor: pointer; font-family: 'Sarabun', sans-serif;
          font-size: 13px; font-weight: 600; color: #fff;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s 0.3s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .back-btn.show { opacity: 1; pointer-events: all; }

        .zoom-dock {
          position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px; padding: 8px 12px;
          background: rgba(255,255,255,0.3);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,200,210,0.5);
          border-radius: 999px;
          box-shadow: 0 8px 32px rgba(220,100,120,0.15);
          transition: opacity 0.3s, transform 0.3s;
          white-space: nowrap;
          z-index: 240;
        }
        .zoom-dock.hide { opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(40px); }
        .dock-btn-new {
          background: transparent; border: none; cursor: pointer;
          font-family: 'Sarabun', sans-serif; font-size: 13px; font-weight: 600;
          color: #7a3450; padding: 6px 12px; border-radius: 999px;
          transition: background 0.2s;
        }
        .dock-btn-new:hover { background: rgba(255,255,255,0.4); }

        .dispenser-section {
          background: linear-gradient(160deg, #fff0f8, #fff8ee);
          padding: 5rem 1rem 4rem;
          position: relative; z-index: 1;
        }

        .strip-flow {
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
          position: relative; margin-top: 2rem;
        }
        .dispenser-slot {
          width: min(300px, 85vw);
          background: linear-gradient(135deg, #3d2235, #2d1b2e);
          border-radius: 12px 12px 0 0; padding: 0.6rem 1rem 0;
          display: flex; justify-content: center;
          box-shadow: 0 -4px 20px rgba(60,20,40,0.2);
        }
        .slot-slit {
          width: 80%; height: 8px; background: #1a0a1e;
          border-radius: 999px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.5);
        }
        .photos-cascade {
          display: flex; flex-direction: column; align-items: center;
          position: relative; padding-bottom: 2rem;
        }
        .photo-card {
          width: min(260px, 78vw); background: #fff; border-radius: 8px;
          padding: 0.75rem 0.75rem 2rem;
          box-shadow: 0 8px 24px rgba(60,20,40,0.15), 0 2px 8px rgba(60,20,40,0.1);
          position: relative; transition: transform 0.3s, box-shadow 0.3s;
          margin-top: -28px; cursor: pointer;
        }
        .photo-card:first-child { margin-top: 0; }
        .photo-card:hover {
          box-shadow: 0 20px 48px rgba(60,20,40,0.25);
          z-index: 10;
          transform: scale(1.04) rotate(0deg) !important;
        }
        .photo-img { width: 100%; aspect-ratio: 1; border-radius: 4px; overflow: hidden; }
        .thumb-scene {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 3rem; border-radius: 4px;
        }
        .tape {
          position: absolute; width: 48px; height: 16px;
          background: rgba(255,213,160,0.55); border-radius: 2px; z-index: 2;
        }
        .tape-tl { top: -6px; left: 20px; transform: rotate(-8deg); }
        .tape-tr { top: -6px; right: 20px; transform: rotate(8deg); }
        .photo-caption {
          font-family: 'Caveat', cursive; font-size: 1rem;
          color: var(--text-mid); text-align: center;
          margin-top: 0.4rem; line-height: 1.3;
        }
        .doodle-hearts { font-size: 0.8rem; display: inline-block; animation: doodleWiggle 2s ease-in-out infinite; }
        @keyframes doodleWiggle {
          0%,100% { transform: rotate(-5deg); }
          50%      { transform: rotate(5deg); }
        }

        .story-outer { padding: 5rem 1rem; max-width: 560px; margin: 0 auto; position: relative; z-index: 1; }
        .story-step {
          display: flex; gap: 1.5rem; align-items: flex-start;
          opacity: 0; transform: translateX(-24px);
          transition: opacity 0.7s, transform 0.7s;
        }
        .story-step.vis { opacity: 1; transform: translateX(0); }
        .story-step.right { transform: translateX(24px); }
        .story-step.right.vis { transform: translateX(0); }
        .story-icon {
          flex-shrink: 0; width: 56px; height: 56px;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; box-shadow: 0 6px 18px rgba(255,133,161,0.3);
        }
        .story-text h3 { font-family: 'Pacifico', cursive; font-size: 1.1rem; color: var(--text-dark); margin-bottom: 0.3rem; }
        .story-text p  { font-size: 0.9rem; color: var(--text-mid); line-height: 1.6; }

        .accounts-section {
          background: linear-gradient(160deg, #fff0fa, #fff9f0);
          padding: 5rem 1rem 4rem; position: relative; z-index: 1;
        }
        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem; max-width: 680px; margin: 2rem auto 0;
        }
        .account-card {
          background: #fff; border-radius: 20px; border: 2px solid var(--blush);
          padding: 1.25rem 0.75rem; display: flex; flex-direction: column;
          align-items: center; gap: 0.75rem; cursor: pointer;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .account-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,214,224,0.4), rgba(255,232,181,0.4));
          opacity: 0; transition: opacity 0.25s; border-radius: inherit;
        }
        .account-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(255,133,161,0.22); border-color: var(--rose); }
        .account-card:hover::before { opacity: 1; }
        .acc-avatar {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          overflow: hidden; box-shadow: 0 4px 12px rgba(255,133,161,0.3);
          display: flex; align-items: center; justify-content: center; font-size: 1.6rem; position: relative;
        }
        .acc-badge {
          position: absolute; bottom: -4px; right: -4px;
          width: 18px; height: 18px; background: #4ade80;
          border-radius: 50%; border: 2px solid #fff;
          font-size: 8px; display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 900;
        }
        .acc-name { font-size: 0.78rem; font-weight: 800; color: var(--text-dark); text-align: center; }
        .acc-niche { font-size: 0.7rem; color: var(--text-light); display: flex; align-items: center; gap: 0.25rem; }
        .acc-gen-count {
          font-size: 0.65rem; font-weight: 800;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          color: var(--text-mid); padding: 0.15rem 0.6rem; border-radius: 999px;
        }

        .cta-section {
          padding: 5rem 1rem 6rem;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
          text-align: center; position: relative; z-index: 1;
        }
        .cta-btn {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: linear-gradient(135deg, var(--rose), #f5a0c0, var(--gold-deep));
          color: #fff; font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 800;
          padding: 1rem 2.5rem; border-radius: 999px; border: none; cursor: pointer;
          box-shadow: 0 8px 28px rgba(224,92,122,0.4);
          transition: all 0.25s; text-decoration: none; letter-spacing: 0.04em;
        }
        .cta-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 40px rgba(224,92,122,0.5); }

        .section-title {
          font-family: 'Pacifico', cursive;
          font-size: clamp(1.5rem, 5vw, 2.5rem);
          color: var(--text-dark); text-align: center; margin-bottom: 0.5rem;
          text-shadow: 2px 3px 0 rgba(255,133,161,0.2);
        }
        .section-label {
          font-family: 'Caveat', cursive;
          font-size: 1rem; color: var(--rose); letter-spacing: 0.1em;
          margin-bottom: 0.5rem; opacity: 0;
          transition: opacity 0.6s, transform 0.6s; transform: translateY(12px);
        }
        .section-label.vis { opacity: 1; transform: translateY(0); }
        .squiggle {
          width: 80px; height: 12px; margin: 0.5rem auto;
          backgroundImage: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 12'%3E%3Cpath d='M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6' fill='none' stroke='%23ff85a1' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-size: contain;
        }
        .glow-underline { display: inline-block; position: relative; }
        .glow-underline::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 4px; background: linear-gradient(90deg, var(--rose), var(--gold-deep));
          border-radius: 999px; filter: blur(2px); animation: underlineGlow 2s ease-in-out infinite;
        }
        @keyframes underlineGlow {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .reveal {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.7s, transform 0.7s;
        }
        .reveal.vis { opacity: 1; transform: translateY(0); }

        @media (max-width: 480px) {
          .accounts-grid { grid-template-columns: repeat(2, 1fr); }
          .story-step { flex-direction: column; align-items: center; text-align: center; }
        }

        /* ── Passcode Modal ── */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(30, 8, 20, 0.55);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          animation: modalFadeIn 0.25s ease both;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .modal-box {
          background: linear-gradient(160deg, #fff8f5, #ffeef5);
          border: 2px solid rgba(255,181,196,0.5);
          border-radius: 28px;
          padding: 2.5rem 2rem 2rem;
          width: min(380px, 90vw);
          text-align: center;
          box-shadow: 0 32px 80px rgba(224,92,122,0.25), 0 0 0 1px rgba(255,255,255,0.6) inset;
          position: relative;
          animation: modalSlideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        @keyframes modalSlideUp {
          from { transform: translateY(32px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        .modal-box.shake {
          animation: modalShake 0.5s ease both;
        }
        @keyframes modalShake {
          0%,100% { transform: translateX(0); }
          15%     { transform: translateX(-10px); }
          35%     { transform: translateX(10px); }
          55%     { transform: translateX(-8px); }
          75%     { transform: translateX(8px); }
          90%     { transform: translateX(-4px); }
        }
        .modal-close {
          position: absolute; top: 14px; right: 16px;
          background: none; border: none; cursor: pointer;
          font-size: 1.1rem; color: var(--text-light);
          line-height: 1; padding: 4px;
          transition: transform 0.2s, color 0.2s;
        }
        .modal-close:hover { transform: scale(1.2); color: var(--rose); }
        .modal-icon {
          font-size: 2.8rem;
          margin-bottom: 0.75rem;
          display: block;
          animation: iconBounce 1.4s ease-in-out infinite;
        }
        @keyframes iconBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .modal-title {
          font-family: 'Pacifico', cursive;
          font-size: 1.4rem;
          color: var(--text-dark);
          margin-bottom: 0.3rem;
        }
        .modal-sub {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: var(--text-mid);
          margin-bottom: 1.5rem;
        }
        .passcode-dots {
          display: flex; justify-content: center; gap: 12px;
          margin-bottom: 1.5rem;
        }
        .passcode-dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid var(--rose);
          background: transparent;
          transition: background 0.2s, transform 0.2s;
        }
        .passcode-dot.filled {
          background: var(--rose);
          transform: scale(1.1);
        }
        .numpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          max-width: 240px;
          margin: 0 auto 1rem;
        }
        .num-btn {
          background: rgba(255,255,255,0.8);
          border: 1.5px solid rgba(255,181,196,0.4);
          border-radius: 14px;
          padding: 0.9rem 0;
          font-family: 'Nunito', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-dark);
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 2px 8px rgba(255,133,161,0.1);
        }
        .num-btn:hover {
          background: var(--blush);
          transform: scale(1.06);
          box-shadow: 0 4px 16px rgba(255,133,161,0.2);
        }
        .num-btn:active { transform: scale(0.96); }
        .num-btn.del {
          font-size: 1rem;
          color: var(--text-mid);
        }
        .modal-error {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: var(--rose-dark);
          margin-bottom: 0.5rem;
          min-height: 1.4rem;
          animation: modalFadeIn 0.2s ease;
        }
        .modal-success-overlay {
          position: absolute; inset: 0;
          border-radius: 26px;
          background: linear-gradient(135deg, rgba(255,214,224,0.95), rgba(255,240,200,0.95));
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.5rem;
          animation: modalFadeIn 0.3s ease;
        }
        .success-icon {
          font-size: 3rem;
          animation: successPop 0.4s cubic-bezier(0.34,1.5,0.64,1) both;
        }
        @keyframes successPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .success-text {
          font-family: 'Pacifico', cursive;
          font-size: 1.2rem;
          color: var(--text-dark);
        }

        /* ── Content Gate ── */
        .content-gate {
          position: relative;
        }
        .gate-blur {
          filter: blur(6px);
          pointer-events: none;
          user-select: none;
          transition: filter 0.6s ease;
        }
        .gate-wall {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 220px;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(255,248,240,0.7) 30%,
            rgba(255,248,240,0.97) 70%,
            #fff8f0 100%);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 2rem;
          gap: 0.6rem;
          pointer-events: none;
        }
        .gate-wall-label {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: var(--text-mid);
          pointer-events: none;
        }
      `}</style>

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=Pacifico&family=Caveat:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Sarabun:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="bokeh-layer" id="bokeh" />
      <div className="confetti-layer" id="confetti" />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-tag">💕 Capture Every Moment Together</div>
        <h1 className="hero-title">
          Cute Cartoon<br />
          <span>Photo Booth</span>
        </h1>
        <p className="hero-sub">เก็บทุกความทรงจำแสนน่ารักของคู่รักไว้ตลอดไป ✨</p>

        <div className="booth-scene" id="boothScene1">
          <div className="spatial-label" style={{ top: "-28px", left: "-10px" }}>[ เลื่อนเพื่อสำรวจเรื่องราว ]</div>
          <div className="spatial-label" style={{ bottom: "20px", right: "-30px", animationDelay: "1.2s", fontSize: "0.65rem" }}>💛 รูปถ่ายสุดน่ารัก</div>

          <div className="booth-wrap" ref={boothWrap1Ref}>
            <div className="booth-body">
              <div className="booth-deco" style={{ top: "12px", left: "12px" }}>💛</div>
              <div className="booth-deco" style={{ top: "12px", right: "12px", animationDelay: "1s" }}>⭐</div>
              <div className="booth-flash">
                <div className="flash-heart">💗</div>
                <div className="flash-heart">💖</div>
                <div className="flash-heart">💗</div>
              </div>
              <div className="booth-brand">✨ Love Booth ✨</div>
              <div className="screen-frame">
                <div className="cartoon-scene">
                  <div className="scene-star" style={{ top: "10%", left: "15%", animationDelay: "0.3s" }} />
                  <div className="scene-star" style={{ top: "20%", left: "35%", animationDelay: "0.7s", width: "3px", height: "3px" }} />
                  <div className="scene-star" style={{ top: "8%", right: "20%", animationDelay: "1.1s" }} />
                  <div className="scene-star" style={{ top: "25%", right: "35%", animationDelay: "0.5s", width: "3px", height: "3px" }} />
                  <div className="scene-star" style={{ top: "15%", left: "55%", animationDelay: "1.5s" }} />
                  <div className="scene-sun" />
                  <div className="scene-sea" />
                  <div className="couple">
                    <div className="figure fig1">
                      <div className="heart-pop">💕</div>
                      <div className="fig-head" />
                      <div className="fig-body" />
                    </div>
                    <div className="figure fig2">
                      <div className="fig-head" />
                      <div className="fig-body" />
                    </div>
                  </div>
                </div>

                <div className="screen-controls">
                  <button className="ctrl-btn" id="playBtn1" title="เล่น/หยุด">
                    <div className="ctrl-play-icon" id="playIcon1" />
                  </button>
                  <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.2)" }} />
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", fontFamily: "'Caveat',cursive" }}>LIVE ♥</span>
                </div>
              </div>

              <div className="booth-stars">
                <span>⭐</span><span>💛</span><span>🌸</span><span>💛</span><span>⭐</span>
              </div>
              <div className="booth-slot">
                <div className="coin-insert" id="startBtn1">
                  <span>🪙</span> INSERT COIN TO START
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-hint">
          <span>เลื่อนลงเพื่อดูเพิ่มเติม</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="section-title">พร้อมแล้วหรือยัง? 💕</div>
        <p style={{ fontFamily: "'Caveat',cursive", fontSize: "1.2rem", color: "var(--text-mid)" }}>
          {isUnlocked ? "เริ่มต้นบทใหม่ของความรักกันเลย ✨" : "ใส่รหัสเพื่อปลดล็อกเนื้อหาทั้งหมด 🔒"}
        </p>
        <button className="cta-btn" onClick={isUnlocked ? undefined : openModal}
          style={isUnlocked ? { background: "linear-gradient(135deg,#4ade80,#22c55e)", cursor: "default" } : {}}>
          <span>{isUnlocked ? "✅" : "🔐"}</span>
          {isUnlocked ? "ปลดล็อกแล้ว — เลื่อนดูได้เลย!" : "ใส่รหัสผ่าน"}
        </button>
        <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.5rem", fontFamily: "'Caveat',cursive" }}>
          {isUnlocked ? "🔓 session ใช้งานได้อีก 24 ชั่วโมง" : "♡ Made with love · Photo Booth ♡"}
        </p>
      </section>

      {/* ── CONTENT (ซ่อนทั้งหมดถ้ายังไม่ unlock) ── */}
      <div style={{
        height: isUnlocked ? "auto" : 0,
        overflow: isUnlocked ? "visible" : "hidden",
        transition: "none",
      }}>
        <div style={{ filter: isUnlocked ? "none" : "blur(8px)" }}>

      {/* ── DISPENSER ── */}
      <section className="dispenser-section">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <p className="section-label vis" style={{ opacity: 1, transform: "none" }}>📸 แกลเลอรีความทรงจำ</p>
          <div className="section-title reveal" id="r1">รูปถ่ายสุดน่ารัก</div>
          <div className="squiggle" />
        </div>

        <div className="strip-flow">
          <div className="dispenser-slot"><div className="slot-slit" /></div>
          <div className="photos-cascade">

            <div className="photo-card" style={{ transform: "rotate(-3deg)", zIndex: 5 }} data-rot="-3deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#ffb3c6,#ff6b9d)" }}>🌅</div>
              </div>
              <div className="photo-caption">
                ริมทะเลพระอาทิตย์ตก 🌊<br />
                <span className="doodle-hearts">♡ ♡ ♡</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(2.5deg)", zIndex: 4, marginTop: "-20px" }} data-rot="2.5deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#d4eeff,#85c1e9)" }}>🌸</div>
              </div>
              <div className="photo-caption">
                ใต้ซากุระสีชมพู 🌸<br />
                <span className="doodle-hearts">✿ ✿ ✿</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(-1.5deg)", zIndex: 3, marginTop: "-20px" }} data-rot="-1.5deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#d4f5e9,#5dade2)" }}>☕</div>
              </div>
              <div className="photo-caption">
                คาเฟ่วันฝนตก ☕<br />
                <span className="doodle-hearts">☁ ☁ ☁</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(3deg)", zIndex: 2, marginTop: "-20px" }} data-rot="3deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#e8d5f5,#c39bd3)" }}>🎡</div>
              </div>
              <div className="photo-caption">
                งานเทศกาลสุดสนุก 🎡<br />
                <span className="doodle-hearts">★ ★ ★</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(-2deg)", zIndex: 1, marginTop: "-20px" }} data-rot="-2deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#fff8dc,#ffd89b)" }}>🌙</div>
              </div>
              <div className="photo-caption">
                คืนดาวพราว 🌙<br />
                <span className="doodle-hearts">✦ ✦ ✦</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="story-outer">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p className="section-label" id="sl2">💕 เรื่องราวของเรา</p>
          <h2 className="section-title reveal" id="r2">การเดินทางแสนหวาน</h2>
          <div className="squiggle" />
        </div>

        <div className="story-step" id="s1">
          <div className="story-icon">🌷</div>
          <div className="story-text">
            <h3>พบกันครั้งแรก</h3>
            <p>ทุกเรื่องราวความรักเริ่มต้นจากการพบกัน ณ ตู้ถ่ายภาพแห่งนี้ เราจะเก็บทุกช่วงเวลาไว้ตลอดไป</p>
          </div>
        </div>

        <div className="story-step right" id="s2" style={{ marginTop: "2rem" }}>
          <div className="story-icon">📸</div>
          <div className="story-text">
            <h3>ถ่ายภาพด้วยกัน</h3>
            <p>สร้างความทรงจำสุดน่ารักผ่านเลนส์การ์ตูน ทุกรูปถ่ายคือความรักที่ถูกแช่แข็งไว้</p>
          </div>
        </div>

        <div className="story-step" id="s3" style={{ marginTop: "2rem" }}>
          <div className="story-icon">💌</div>
          <div className="story-text">
            <h3>ส่งต่อความรัก</h3>
            <p>แชร์ความสุขกับคนที่คุณรัก บอกเล่าเรื่องราวหวานๆ ผ่านแถบรูปโพลารอยด์ที่เต็มไปด้วยหัวใจ</p>
          </div>
        </div>
      </section>

            {/* ── ZOOM SECTION ── */}
      <section className="zoom-section">
        <div className="zoom-header">
          <div className="zoom-header-tag">🔍 Interactive Experience</div>
          <h2 className="section-title reveal" id="zr1">ซูมเข้าไปสำรวจตู้</h2>
          <div className="squiggle" />
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: "1.1rem", color: "var(--text-mid)", marginTop: "0.5rem" }}
             className="reveal" id="zr2">
            กดที่ส่วนต่างๆ ของตู้เพื่อดูรายละเอียด ✨
          </p>
        </div>

        <div className="zoom-backdrop" id="zoomBackdrop" />
        <button className="back-btn" id="backBtn">← ถอยกลับ</button>

        <div className="zoom-canvas" id="zoomCanvas">
          <div className="booth-interactive" id="boothInteractive">

            <svg className="booth-svg" viewBox="0 0 400 580" overflow="visible">
              <defs>
                <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff5f0" />
                  <stop offset="100%" stopColor="#fde8f0" />
                </linearGradient>
                <linearGradient id="top2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f9c8d9" />
                  <stop offset="100%" stopColor="#f0a8c0" />
                </linearGradient>
                <linearGradient id="trim2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e8b4a0" />
                  <stop offset="100%" stopColor="#b07860" />
                </linearGradient>
                <linearGradient id="panelGrad2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fce8f0" />
                  <stop offset="100%" stopColor="#f8d0e0" />
                </linearGradient>
                <linearGradient id="velvetGrad2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#6b1a2e" />
                  <stop offset="30%"  stopColor="#8b2040" />
                  <stop offset="60%"  stopColor="#7a1a34" />
                  <stop offset="100%" stopColor="#5a1426" />
                </linearGradient>
                <filter id="shadow2">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#c87090" floodOpacity="0.25" />
                </filter>
              </defs>

              <ellipse cx="195" cy="570" rx="130" ry="14" fill="rgba(120,40,70,0.12)" />

              <path d="M 30 60 Q 10 120 20 200 Q 15 280 25 360 Q 20 430 30 500 L 72 500 Q 62 430 68 360 Q 74 280 68 200 Q 72 120 72 60 Z"
                fill="url(#velvetGrad2)" />
              <path d="M 45 60 Q 35 130 38 220 Q 35 300 40 380 Q 37 450 42 500"
                stroke="rgba(40,0,15,0.3)" strokeWidth="2" fill="none" />
              <rect x="20" y="52" width="60" height="10" rx="5" fill="url(#trim2)" />

              <rect x="72" y="50" width="260" height="490" rx="20" fill="url(#bg2)" filter="url(#shadow2)" />
              <rect x="72" y="50" width="260" height="70"  rx="20" fill="url(#top2)" />
              <rect x="72" y="95" width="260" height="25"  fill="url(#top2)" />
              <rect x="72" y="115" width="260" height="8"  fill="url(#trim2)" opacity="0.8" />

              <rect x="94"  y="118" width="194" height="208" rx="12" fill="url(#trim2)" />
              <rect x="98"  y="122" width="186" height="200" rx="10" fill="#1a0d18" />

              <line x1="80" y1="335" x2="312" y2="335" stroke="url(#trim2)" strokeWidth="3" opacity="0.6" />

              <rect x="112" y="345" width="158" height="80" rx="8"
                fill="rgba(180,80,100,0.08)" stroke="url(#trim2)" strokeWidth="1.5" />
              <rect x="130" y="365" width="122" height="12" rx="6" fill="#2a1520" />
              <rect x="132" y="367" width="118" height="8"  rx="4" fill="#1a0d18" />
              <text x="191" y="358" fontSize="7" textAnchor="middle"
                fontFamily="'Sarabun',sans-serif" fill="#c47b8a" letterSpacing="1.5">PHOTO PRINTS</text>

              <rect x="308" y="130" width="52" height="200" rx="10"
                fill="url(#panelGrad2)" stroke="url(#trim2)" strokeWidth="1.5" />
              <rect x="310" y="132" width="48" height="196" rx="9" fill="rgba(255,255,255,0.5)" />
              <text x="334" y="148" fontSize="6" textAnchor="middle"
                fontFamily="'Sarabun',sans-serif" fill="#c47b8a" letterSpacing="1">CONTROLS</text>

              <circle cx="334" cy="162" r="14" fill="#ff4d6d" opacity="0.15" />
              <circle cx="334" cy="162" r="11" fill="#ff4d6d" opacity="0.9" />
              <text x="334" y="166" fontSize="11" textAnchor="middle">📸</text>

              <circle cx="334" cy="198" r="14" fill="#ff8fa3" opacity="0.15" />
              <circle cx="334" cy="198" r="11" fill="#ff8fa3" opacity="0.9" />
              <text x="334" y="202" fontSize="11" textAnchor="middle">🎨</text>

              <circle cx="334" cy="234" r="14" fill="#ffb3c6" opacity="0.15" />
              <circle cx="334" cy="234" r="11" fill="#ffb3c6" opacity="0.9" />
              <text x="334" y="238" fontSize="11" textAnchor="middle">⭐</text>

              <circle cx="334" cy="270" r="14" fill="#ffd6e0" opacity="0.15" />
              <circle cx="334" cy="270" r="11" fill="#ffd6e0" opacity="0.9" />
              <text x="334" y="274" fontSize="11" textAnchor="middle">🖨️</text>

              <text x="334" y="315" fontSize="16" textAnchor="middle" fill="#c47b8a">💰</text>
              <text x="334" y="330" fontSize="5"  textAnchor="middle"
                fontFamily="'Sarabun',sans-serif" fill="#c47b8a" letterSpacing="0.5">INSERT COIN</text>

              <rect x="80" y="530" width="244" height="20" rx="10" fill="url(#top2)" opacity="0.8" />
            </svg>

            {/* Zone: Screen — SVG rect x=98 y=122 w=186 h=200 → %of 400×580 */}
            <div className="zone" id="zone-screen"
              style={{ left: "24.5%", top: "21%", width: "46.5%", height: "34.5%", borderRadius: "10px",
                       background: "#1a0d18", padding: "4px", containerType: "size" as React.CSSProperties["containerType"] }}>
              <div className="video-zone-content">
                <div className="video-scene" id="videoScene"
                  style={{ background: "linear-gradient(160deg,#ff9a56,#ffad7e,#ffd6a8)" }}>
                  <span className="video-emoji" id="videoEmoji">💃🕺</span>
                </div>
              </div>
              <div className="video-controls-overlay" id="videoControlsOverlay">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "'Sarabun',sans-serif", fontSize: "6px", color: "#fff", fontWeight: 600 }}>
                    June 14, 2024
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button id="videoPlayBtn"
                    style={{ background: "#fff", border: "none", borderRadius: "50%",
                             width: "14px", height: "14px", display: "flex", alignItems: "center",
                             justifyContent: "center", cursor: "pointer", fontSize: "8px", color: "#7a3450" }}>
                    ⏸
                  </button>
                  <div style={{ flex: 1, height: "2px", background: "rgba(255,255,255,0.3)", borderRadius: "99px" }}>
                    <div id="progressBar"
                      style={{ height: "100%", width: "45%", background: "#ffb3c6", borderRadius: "99px",
                               transition: "width 2s linear" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Zone: Controls — SVG rect x=308 y=130 w=52 h=200 → %of 400×580 */}
            <div className="zone" id="zone-controls"
              style={{ left: "77%", top: "22.4%", width: "13%", height: "34.5%", borderRadius: "10px" }} />

            {/* Zone: Photos — SVG rect x=112 y=345 w=158 h=80 → %of 400×580 */}
            <div className="zone" id="zone-photos"
              style={{ left: "28%", top: "59.5%", width: "39.5%", height: "13.8%", borderRadius: "8px",
                       display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: "4px" }}>
              <div className="polaroid-strip-preview" id="polaroidPreview">
                <div /><div /><div />
              </div>
            </div>

            {/* Badges */}
            <div className="hint-badge-new" id="badge-photos"
              style={{ left: "48%", top: "78%" }}
              onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("photos")}>
              📸 ดูภาพถ่าย
            </div>
            <div className="hint-badge-new" id="badge-screen"
              style={{ left: "10%", top: "37%" }}
              onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("screen")}>
              ▶ ซูมวิดีโอ
            </div>
            <div className="hint-badge-new" id="badge-controls"
              style={{ left: "95%", top: "37%" }}
              onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("controls")}>
              ⚙️ แผงควบคุม
            </div>

            {/* Dock */}
            <div className="zoom-dock" id="zoomDock">
              <button className="dock-btn-new"
                onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("photos")}>📸 Gallery</button>
              <button className="dock-btn-new"
                onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("screen")}>▶ Video</button>
              <button className="dock-btn-new"
                onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("controls")}>⚙️ Setup</button>
            </div>

          </div>
        </div>

        {/* Info Panels */}
        <div className="info-panel" id="panel-screen">
          <div className="info-panel-inner" style={{ textAlign: "center" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic",
                         fontSize: "18px", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                         marginBottom: "6px" }}>
              Sunset Boardwalk
            </h3>
            <p style={{ fontFamily: "'Sarabun',sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
              June 14, 2024 &bull; 3 min 42 sec
            </p>
          </div>
        </div>

        <div className="info-panel" id="panel-photos">
          <div className="info-panel-inner" style={{ padding: "12px" }}>
            <p style={{ fontFamily: "'Caveat',cursive", fontSize: "13px", color: "rgba(255,255,255,0.8)",
                        textAlign: "center", marginBottom: "8px" }}>📸 รูปถ่ายของเรา</p>
            <div ref={photoPanelInnerRef} className="panel-photos-inner" />
          </div>
        </div>

        <div className="info-panel" id="panel-controls">
          <div className="info-panel-inner">
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic",
                         fontSize: "22px", color: "#fff", marginBottom: "16px",
                         textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              Booth Controls
            </h3>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>📸</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Capture Mode</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>สลับโหมดภาพนิ่งและวิดีโอ</div>
              </div>
            </button>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>🎨</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Filter &amp; Colors</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>ปรับแต่งโทนสีให้ดูละมุน</div>
              </div>
            </button>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>⭐</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Stickers</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>ตกแต่งรูปด้วยสติ๊กเกอร์</div>
              </div>
            </button>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>🖨️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Print Layout</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>เลือกกรอบและสั่งพิมพ์</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── ACCOUNTS ── */}
      <section className="accounts-section">
        <div style={{ textAlign: "center", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
          <p className="section-label" id="sl3">🍋 Lemon8 Content Agent</p>
          <h2 className="section-title reveal" id="r3">
            เลือก <span className="glow-underline">Account</span>
          </h2>
          <div className="squiggle" />
          <p style={{ fontSize: "0.85rem", color: "var(--text-light)", marginTop: "0.75rem" }}
             className="reveal" id="r4">
            เลือก Account เพื่อจัดการ Content สุดน่ารัก
          </p>
        </div>
        <div className="accounts-grid" id="accountsGrid" ref={accountsGridRef} />
      </section>

      </div> {/* end inner blur div */}
      </div> {/* end height/overflow gate */}

      {/* ── PASSCODE MODAL ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className={`modal-box${shake ? " shake" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success overlay */}
            {success && (
              <div className="modal-success-overlay">
                <span className="success-icon">💖</span>
                <span className="success-text">ยินดีต้อนรับ!</span>
                <span style={{ fontFamily: "'Caveat',cursive", color: "var(--text-mid)", fontSize: "0.95rem" }}>
                  กำลังปลดล็อก...
                </span>
              </div>
            )}

            <button className="modal-close" onClick={closeModal}>✕</button>
            <span className="modal-icon">🔐</span>
            <div className="modal-title">ใส่รหัสผ่าน</div>
            <div className="modal-sub">กรอกรหัส 4 หลักเพื่อปลดล็อกเนื้อหา</div>

            {/* Dots indicator */}
            <div className="passcode-dots">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`passcode-dot${passcode.length > i ? " filled" : ""}`} />
              ))}
            </div>

            <div className="modal-error">{error}</div>

            {/* Numpad */}
            <div className="numpad">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => {
                if (key === "") return <div key={idx} />;
                return (
                  <button
                    key={idx}
                    className={`num-btn${key === "⌫" ? " del" : ""}`}
                    onClick={() => handlePasscodeInput(key)}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
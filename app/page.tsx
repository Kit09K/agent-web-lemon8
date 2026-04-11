"use client";

import { useState, useEffect } from "react";

// ---- Types ----
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

type HistoryItem = {
  title: string;
  caption: string;
  type?: string;
  date: string;
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

// ---- Constants ----
const NICHES = [
  { label: "Lifestyle", value: "lifestyle" },
  { label: "Beauty", value: "beauty" },
  { label: "Fashion", value: "fashion" },
  { label: "Food", value: "food" },
  { label: "Travel", value: "travel" },
  { label: "Wellness", value: "wellness" },
  { label: "Finance", value: "finance" },
  { label: "Productivity", value: "productivity" },
];

// ---- Sub-components ----
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-gray-400 capitalize">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-800 rounded-full transition-all duration-500"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-500 text-xs">{value}</span>
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
      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700"
    >
      {copied ? "✓ Copied!" : "Copy caption"}
    </button>
  );
}

function IdeaCard({ idea, isBest }: { idea: Idea; isBest: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 bg-white ${isBest ? "border-gray-800" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900 leading-snug">{idea.title}</h3>
        {isBest && (
          <span className="shrink-0 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-full">
            Top pick
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-500">{idea.type}</span>
        <span className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-500">{idea.angle}</span>
      </div>
      <p className="text-sm text-gray-400 italic border-l-2 border-gray-100 pl-3">"{idea.hook}"</p>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{idea.caption}</p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          {Object.entries(idea.score).map(([k, v]) => <ScoreBar key={k} label={k} value={v} />)}
        </div>
        <CopyButton text={idea.caption} />
      </div>
    </div>
  );
}

function HistoryPanel({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No history yet</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {[...items].reverse().map((item, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
            {item.type && (
              <span className="shrink-0 text-xs text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full bg-white">
                {item.type}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {new Date(item.date).toLocaleDateString("th-TH", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}

function ScrapedPostsPanel({ contents }: { contents: ScrapedContent[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? contents : contents.slice(0, 5);

  return (
    <div className="flex flex-col gap-2 mt-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Scraped Posts ({contents.length})
      </p>
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
        {shown.map((post, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-3 flex flex-col gap-1"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 leading-snug">
                {post.title}
              </p>
              {post.stats && (
                <span className="shrink-0 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                  ♥ {post.stats}
                </span>
              )}
            </div>
            {post.description && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {post.description}
              </p>
            )}
          </div>
        ))}
      </div>
      {contents.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center py-1"
        >
          {expanded ? "▲ Show less" : `▼ Show all ${contents.length} posts`}
        </button>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function Home() {
  const [niche, setNiche] = useState("lifestyle");
  const [lemon8Url, setLemon8Url] = useState("");
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/history");
      const json = await res.json();
      if (json.success) setHistory(json.data);
    } catch { /* silent */ }
  }

  // ---- Scrape ----
  async function handleScrape() {
    if (!lemon8Url.trim()) return;
    setScraping(true);
    setScrapeError(null);
    setScrapeResult(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: lemon8Url.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setScrapeError(json.error || "Scrape failed");
        return;
      }
      setScrapeResult(json);
    } catch {
      setScrapeError("Cannot connect to scraper");
    } finally {
      setScraping(false);
    }
  }

  // ---- Generate ----
  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          scrapedContents: scrapeResult?.contents ?? undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Something went wrong");
        return;
      }
      setResult(json.data);
      fetchHistory();
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }

  const bestTitles = new Set(result?.best_ideas.map((b) => b.title) ?? []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lemon8 Content Agent</h1>
          <p className="text-sm text-gray-400 mt-1">
            Generate viral ideas — no duplicates, always fresh.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6 shadow-sm">

          {/* Step 1: Scrape (Optional) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Step 1 — Scrape Lemon8 Profile
              </label>
              <span className="text-xs text-gray-300">Optional</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={lemon8Url}
                onChange={(e) => setLemon8Url(e.target.value)}
                placeholder="https://www.lemon8-app.com/@username"
                className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-black placeholder-gray-300 text-gray-900"
              />
              <button
                onClick={handleScrape}
                disabled={scraping || !lemon8Url.trim()}
                className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600 whitespace-nowrap"
              >
                {scraping ? "Scraping..." : "Scrape"}
              </button>
            </div>

            {/* Scrape error */}
            {scrapeError && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {scrapeError}
              </p>
            )}

            {/* Scrape success (แก้ไขโดยย้ายเข้ามาไว้ในนี้) */}
            {scrapeResult && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    {scrapeResult.profile.name}
                  </p>
                  <span className="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                    {scrapeResult.total_contents} posts found
                  </span>
                </div>
                
                {scrapeResult.profile.bio && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {scrapeResult.profile.bio}
                  </p>
                )}

                {scrapeResult.contents.length > 0 && (
                  <ScrapedPostsPanel contents={scrapeResult.contents} />
                )}

                <p className="text-xs text-green-500 font-medium mt-1">
                  ✓ All {scrapeResult.total_contents} posts will be used as AI reference
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-50" />

          {/* Step 2: Niche */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Step 2 — Select Niche
            </label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button
                  key={n.value}
                  onClick={() => setNiche(n.value)}
                  className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                    niche === n.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-50" />

          {/* Step 3: Generate */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Step 3 — Generate
            </label>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Generating ideas..."
                : scrapeResult
                ? `Generate from ${scrapeResult.profile.name}'s profile`
                : "Generate content ideas"}
            </button>
            {scrapeResult && (
              <p className="text-xs text-center text-gray-400">
                Using {scrapeResult.total_contents} scraped posts as reference
              </p>
            )}
          </div>
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
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3 animate-pulse">
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
            {/* Analysis */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Analysis</p>
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
              <div className="pt-2 border-t border-gray-50 flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 self-center">Avoid:</span>
                {result.avoid.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-red-50 text-red-400 border border-red-100 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Ideas */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">5 New ideas</p>
              {result.ideas.map((idea) => (
                <IdeaCard key={idea.title} idea={idea} isBest={bestTitles.has(idea.title)} />
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <span className="font-medium">Content history ({history.length})</span>
            <span className="text-xs">{showHistory ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showHistory && <HistoryPanel items={history} />}
        </div>
      </div>
    </main>
  );
}
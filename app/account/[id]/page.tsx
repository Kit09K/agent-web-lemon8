"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { AgentResult, ScrapeResult, TokenUsage, HistoryEntry } from "@/lib/types";
import { ACCOUNTS_DETAIL, CONTENT_TYPES } from "@/lib/constants";
import { ScoreBar, CopyButton, IdeaCard, HistoryEntryCard, TokenUsageBar, ScrapedPostsModal } from "@/components/ui";

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const selectedAccount = ACCOUNTS_DETAIL.find((a) => a.id === id) || null;

  const [scrapeResults, setScrapeResults] = useState<Record<string, ScrapeResult>>({});

  function updateScrapeResults(updater: (prev: Record<string, ScrapeResult>) => Record<string, ScrapeResult>) {
    setScrapeResults((prev) => {
      const next = updater(prev);
      try { sessionStorage.setItem("scrapeResults", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [niche, setNiche] = useState(selectedAccount?.niche || "lifestyle");
  
  useEffect(() => {
    if (selectedAccount?.niche) {
      setNiche(selectedAccount.niche);
    }
  }, [id]);

  const [contentType, setContentType] = useState("viral_hook");
  const [userPrompt, setUserPrompt] = useState("");
  const [ideaCount, setIdeaCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [tokenLimit, setTokenLimit] = useState<number>(100000);
  const [showScrapedModal, setShowScrapedModal] = useState(false);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("scrapeResults");
      if (raw) setScrapeResults(JSON.parse(raw));
    } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch("/api/history");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load history");
      setHistory(json.data);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setHistoryLoading(false);
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
      updateScrapeResults((prev) => ({ ...prev, [selectedAccount.id]: json }));
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setScraping(false);
    }
  }

  async function handleGenerate() {
    if (!selectedAccount || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setResult(null);
    setGenError(null);
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
        setGenError(json.error || "Generation failed");
        return;
      }
      setResult(json.data);
      if (json.data.tokenUsage) setTokenUsage(json.data.tokenUsage);
      if (json.tokenLimit) setTokenLimit(json.tokenLimit);
      fetchHistory();
    } catch {
      setGenError("Cannot connect to server");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  const currentScrape = selectedAccount ? scrapeResults[selectedAccount.id] : null;
  const currentHistory = selectedAccount ? (history[selectedAccount.id] ?? []) : [];
  const bestTitles = useMemo(() => {
    if (!result?.best_ideas || !Array.isArray(result.best_ideas)) return new Set<string>();
    return new Set(result.best_ideas.map((b) => b.title));
  }, [result]);

  if (!selectedAccount) {
    return (
      <main className="min-h-screen bg-[#fdf8f5] flex items-center justify-center">
        <div className="text-center flex flex-col gap-4 p-12">
          <p className="text-2xl">🔍</p>
          <p className="text-gray-600 font-medium">ไม่พบ Account นี้</p>
          <p className="text-sm text-gray-400">ID: {id}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-orange-500 hover:text-orange-700 underline transition-colors"
          >
            ← กลับหน้าหลัก
          </button>
        </div>
      </main>
    );
  }

  // The rest of Detail JSX
  return <main className="min-h-screen bg-[#fdf8f5]">
        <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">

          {/* Back + Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { router.push("/"); }}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              ← Back
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-300 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
                {selectedAccount.avatar ? (
                  <Image
                    src={selectedAccount.avatar}
                    alt={selectedAccount.label || ""}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gray-200" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedAccount.label}</p>
                <p className="text-xs text-gray-400">{selectedAccount.username}</p>
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
                  {selectedAccount.url}
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
          {genError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-500">
              {genError}
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
                {result.ideas.map((idea, index) => (
                  <IdeaCard
                    key={`${index}-${idea.title}`}
                    idea={idea}
                    isBest={bestTitles.has(idea.title)}
                  />
                ))}
              </div>

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
                History ของ {selectedAccount.label} ({currentHistory.length} ครั้ง)
              </span>
              <span className="text-xs">{historyLoading ? "⏳" : showHistory ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {historyError && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {historyError}
              </p>
            )}
            {showHistory && (
              <div className="flex flex-col gap-3">
                {historyLoading ? (
                  [1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse">
                      <div className="h-3 bg-gray-100 rounded-full w-1/2 mb-2" />
                      <div className="h-2 bg-gray-50 rounded-full w-1/3" />
                    </div>
                  ))
                ) : currentHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    ยังไม่มี History สำหรับ Account นี้
                  </p>
                ) : (
                  [...currentHistory].reverse().map((entry) => (
                    <HistoryEntryCard key={entry.id} entry={entry} />
                  ))
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
}

"use client";

import React, { useState } from "react";
import { Idea, HistoryEntry, TokenUsage, ScrapedContent } from "@/lib/types";

export function ScoreBar({ label, value }: { label: string; value: number }) {
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

export function CopyButton({ text }: { text: string }) {
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

export function IdeaCard({ idea, isBest }: { idea: Idea; isBest: boolean }) {
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
        &quot;{idea.hook}&quot;
      </p>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{idea.caption}</p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          {Object.entries(idea.score).map(([k, v]) => (
            <ScoreBar key={k} label={k} value={v as number} />
          ))}
        </div>
        <CopyButton text={idea.caption} />
      </div>
    </div>
  );
}

export function HistoryEntryCard({ entry }: { entry: HistoryEntry }) {
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
            <p className="text-xs text-gray-500 truncate italic">&quot;{entry.userPrompt}&quot;</p>
          )}
        </div>
        <span className="text-gray-300 text-xs shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 p-4 flex flex-col gap-4">
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

export function TokenUsageBar({
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
      <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
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

export function ScrapedPostsModal({
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

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
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

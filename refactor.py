import os
import re

PAGE_PATH = 'app/page.tsx'
ACCOUNT_PAGE_PATH = 'app/account/[id]/page.tsx'

with open(PAGE_PATH, 'r') as f:
    content = f.read()

# 1. Split into sections
# Top: up to export default function Page() {
top_match = re.search(r'export default function Page\(\) \{', content)
top_part = content[:top_match.start()]
rest = content[top_match.end():]

# In rest, find where Detail View starts and ends
detail_start = rest.find('  // ── Detail View')
if detail_start == -1:
    detail_start = rest.find('if (view === "detail" && selectedAccount) {')

landing_start = rest.find('// ── Render')
if landing_start == -1:
    landing_start = rest.find('  return (\n    <>\n      <style>')

page_state = rest[:detail_start]
detail_jsx = rest[detail_start:landing_start]
landing_jsx = rest[landing_start:]

# --- Generate app/page.tsx (Landing Page) ---
new_page = '''"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ACCOUNTS, CORRECT_CODE, STORAGE_KEY, TTL_MS } from "@/lib/constants";

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

export default function Page() {
  const router = useRouter();
  const accountsGridRef = useRef<HTMLDivElement>(null);
  const photoPanelInnerRef = useRef<HTMLDivElement>(null);
  const boothScene1Ref = useRef<HTMLDivElement>(null);
  const boothWrap1Ref = useRef<HTMLDivElement>(null);

  // ── Modal / unlock state ─────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [passcode, setPasscode]   = useState("");
  const [shake, setShake]         = useState(false);
  const [passcodeError, setPasscodeError] = useState("");
  const [success, setSuccess]     = useState(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const { ts } = JSON.parse(raw);
          if (Date.now() - ts < TTL_MS) return true;
        }
      }
    } catch { /* ignore */ }
    return false;
  });

  function openModal() {
    setPasscode("");
    setPasscodeError("");
    setSuccess(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setPasscode("");
    setPasscodeError("");
  }

  function handlePasscodeInput(key: string) {
    if (key === "⌫") {
      setPasscode((p) => p.slice(0, -1));
      setPasscodeError("");
      return;
    }
    if (passcode.length >= 4) return;
    const next = passcode + key;
    setPasscode(next);
    setPasscodeError("");
    if (next.length === 4) {
      if (next === CORRECT_CODE) {
        setSuccess(true);
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
        setPasscodeError("รหัสไม่ถูกต้อง ลองอีกครั้งนะคะ 💔");
        setShake(true);
        setTimeout(() => { setShake(false); setPasscode(""); }, 600);
      }
    }
  }
'''

# Copy the background and hero booth and zoom booth useEffects, but we need to fix them
# We'll extract them from page_state
bg_start = page_state.find('// ── Background / Confetti')
if bg_start != -1:
    new_page += page_state[bg_start:]

# Now we need to modify landing_jsx for Bug 1 and Bug 3, Bug 4, Bug 5
# Bug 1: Replace accounts grid dom manipulation with JSX
# This requires replacing <div className="accounts-grid" ref={accountsGridRef} /> inside landing_jsx
# Wait, it's actually <div id="accountsGrid" ref={accountsGridRef} className="..." /> or similar
accounts_grid_jsx = """<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-8 accounts-grid">
                  {ACCOUNTS.map((acc, i) => (
                    <div 
                      key={acc.id} 
                      className="account-card reveal bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 border border-orange-100/50 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer relative group"
                      style={{ transitionDelay: `${i * 0.08}s` }}
                      onClick={() => router.push(`/account/${acc.id}`)}>
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-2xl sm:text-3xl shadow-inner relative z-10">
                        {acc.emoji}
                        {acc.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px]">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1 relative z-10 text-center">
                        <span className="font-semibold text-gray-800 text-sm sm:text-base tracking-tight">{acc.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                            {acc.niche}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                            {acc.gens} gens
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>"""

# Replace the empty accounts grid div
landing_jsx = re.sub(r'<div\s+id="accountsGrid"\s+ref=\{accountsGridRef\}\s+className="[^"]+"\s*/>', accounts_grid_jsx, landing_jsx)
landing_jsx = re.sub(r'<div\s+ref=\{accountsGridRef\}\s+className="[^"]+"\s*/>', accounts_grid_jsx, landing_jsx)
landing_jsx = re.sub(r'<div\s+className="[^"]+"\s+ref=\{accountsGridRef\}\s*/>', accounts_grid_jsx, landing_jsx)

# Clean up duplicate useEffects and DOM manipulation in page_state
# We will do this via regex
new_page = re.sub(r'useEffect\(\(\) => \{\s*const observer = new IntersectionObserver[\s\S]*?\}, \[\]\);', '', new_page)
new_page = re.sub(r'useEffect\(\(\) => \{\s*const grid = accountsGridRef\.current;[\s\S]*?\}, \[\]\);', '', new_page)
new_page = re.sub(r'useEffect\(\(\) => \{\s*document\.querySelectorAll\("\.photo-card"\)\.forEach[\s\S]*?\}, \[\]\);', '', new_page)
new_page = re.sub(r'useEffect\(\(\) => \{\s*const raw = localStorage\.getItem\(STORAGE_KEY\);[\s\S]*?\}, \[\]\);', '', new_page)

# Inject the fixed observer and mouse events
fixed_effects = """
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("active");
            }
          });
        },
        { threshold: 0.1 }
      );
      document
        .querySelectorAll(".reveal, .story-step, .section-label, .account-card")
        .forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".photo-card");
    const cleanup: (() => void)[] = [];
    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = ((y - cy) / cy) * -15;
        const ry = ((x - cx) / cx) * 15;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.05, 1.05, 1.05)`;
        card.style.zIndex = "10";
      };
      const onLeave = () => {
        card.style.transform = "";
        card.style.zIndex = "1";
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      cleanup.push(() => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });
    return () => cleanup.forEach((fn) => fn());
  }, []);
"""

# Place fixed_effects before the landing_jsx
new_page += fixed_effects + landing_jsx

with open(PAGE_PATH, 'w') as f:
    f.write(new_page)

# --- Generate app/account/[id]/page.tsx (Detail Page) ---
new_account_page = '''"use client";

import { useState, useEffect } from "react";
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
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [niche, setNiche] = useState(selectedAccount?.niche || "lifestyle");
  const [contentType, setContentType] = useState("viral_hook");
  const [userPrompt, setUserPrompt] = useState("");
  const [ideaCount, setIdeaCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [tokenLimit, setTokenLimit] = useState<number>(100000);
  const [showScrapedModal, setShowScrapedModal] = useState(false);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchHistory();
  }, []);

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
    }
  }

  const currentScrape = selectedAccount ? scrapeResults[selectedAccount.id] : null;
  const currentHistory = selectedAccount ? (history[selectedAccount.id] ?? []) : [];
  const bestTitles = new Set(result?.best_ideas.map((b) => b.title) ?? []);

  if (!selectedAccount) {
    return <div className="p-12 text-center text-gray-500">Account not found</div>;
  }

  // The rest of Detail JSX
'''

# The detail_jsx starts with: if (view === "detail" && selectedAccount) {
#   return ( <main... )
# We will strip the if statement and just use the return.
jsx_match = re.search(r'return\s*\(\s*(<main[\s\S]+)\s*;\s*\}\s*$', detail_jsx)
if jsx_match:
    ret_jsx = jsx_match.group(1)
    
    # Bug fix: In the JSX, change back button onClick
    ret_jsx = ret_jsx.replace('setView("landing"); setResult(null);', 'router.push("/");')
    
    # Fix the components that were extracted: ScoreBar, CopyButton, etc. are now imported.
    # We just return ret_jsx
    new_account_page += f"  return {ret_jsx}\n}}\n"
else:
    # Fallback
    new_account_page += f"  {detail_jsx}\n}}\n"

with open(ACCOUNT_PAGE_PATH, 'w') as f:
    f.write(new_account_page)

print("Refactor complete!")

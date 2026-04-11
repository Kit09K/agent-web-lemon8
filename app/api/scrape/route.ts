import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

let isScraping = false;

const DATA_DIR = path.join(process.cwd(), "data");
const SCRAPED_PATH = path.join(DATA_DIR, "scraped.json");

function saveScrапedData(data: {
  profile: { name: string; bio: string };
  total_contents: number;
  contents: { title: string; description?: string; stats?: string }[];
  scraped_at: string;
}) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SCRAPED_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  if (isScraping) {
    return NextResponse.json(
      { success: false, error: "กำลังดึงข้อมูลอยู่ กรุณารอสักครู่" },
      { status: 429 }
    );
  }

  isScraping = true;
  let browser;

  try {
    const { url } = await req.json();

    if (!url || !url.includes("lemon8-app.com")) {
      throw new Error("Invalid Lemon8 URL");
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    const profileData = await page.evaluate(() => {
      const name =
        document.querySelector(".article_card_user p")?.textContent?.trim() ||
        "Unknown";
      const bio =
        document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      return { name, bio };
    });

    // Scroll loop
    let previousHeight = 0;
    let retryCount = 0;
    while (retryCount < 15) {
      const loadMoreBtn = page.getByText(/ดูเพิ่มเติม|Load More/i);
      const isVisible = await loadMoreBtn.isVisible().catch(() => false);
      if (isVisible) {
        await loadMoreBtn.first().click();
      } else {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }
      await page.waitForTimeout(2000);
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === previousHeight) break;
      previousHeight = currentHeight;
      retryCount++;
    }

    const contents = await page.evaluate(() => {
      const items: { title: string; description?: string; stats?: string }[] = [];
      document.querySelectorAll(".article_card").forEach((card) => {
        const title =
          card.querySelector(".article_card_main_body_title")?.textContent?.trim() ||
          card.querySelector("[class*='title']")?.textContent?.trim() ||
          card.querySelector("h3, h2")?.textContent?.trim();

        const desc =
          card.querySelector(".article_card_main_body_content")?.textContent?.trim() ||
          card.querySelector("[class*='content']")?.textContent?.trim() ||
          card.querySelector("p")?.textContent?.trim();

        const likes =
          card.querySelector(".article_card_like p")?.textContent?.trim() ||
          card.querySelector("[class*='like'] p")?.textContent?.trim();

        if (title) {
          items.push({
            title,
            description: desc || undefined,
            stats: likes || undefined,
          });
        }
      });
      return items;
    });

    const result = {
      profile: profileData,
      total_contents: contents.length,
      contents,
      scraped_at: new Date().toISOString(),
    };

    // บันทึกลง scraped.json
    saveScrапedData(result);
    console.log(`Saved ${contents.length} posts to scraped.json`);

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Playwright Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
    isScraping = false;
  }
}
import { NextRequest, NextResponse } from "next/server";
import { runIdeaAgent, ScrapedContent } from "@/agent/idea";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const niche = (body.niche as string)?.trim() || "lifestyle";
    const model = (body.model as string)?.trim() || "gemini-3.1-pro-preview";
    const scrapedContents = body.scrapedContents as ScrapedContent[] | undefined;

    if (niche.length > 100) {
      return NextResponse.json(
        { success: false, error: "Niche name too long" },
        { status: 400 }
      );
    }

    const result = await runIdeaAgent(niche, model, scrapedContents);

    if ("error" in result) {
      return NextResponse.json(
        { success: false, error: result.error, raw: result.raw },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
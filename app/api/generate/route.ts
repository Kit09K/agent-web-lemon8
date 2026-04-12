import { NextRequest, NextResponse } from "next/server";
import { runIdeaAgent, ScrapedContent, TOKEN_LIMIT } from "@/agent/idea";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const niche = (body.niche as string)?.trim() || "lifestyle";
    const contentType = (body.contentType as string)?.trim() || "viral_hook";
    const userPrompt = (body.userPrompt as string)?.trim() || "";
    const accountId = (body.accountId as string)?.trim() || "default";
    const model = (body.model as string)?.trim() || "gemini-3.1-pro-preview";
    const ideaCount = Math.min(Math.max(Number(body.ideaCount) || 5, 1), 15);
    const scrapedContents = body.scrapedContents as ScrapedContent[] | undefined;

    if (niche.length > 100) {
      return NextResponse.json(
        { success: false, error: "Niche name too long" },
        { status: 400 }
      );
    }

    if (userPrompt.length > 500) {
      return NextResponse.json(
        { success: false, error: "User prompt too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const result = await runIdeaAgent({
      niche,
      contentType,
      userPrompt,
      accountId,
      ideaCount,
      model,
      externalHistory: scrapedContents,
    });

    if ("error" in result) {
      return NextResponse.json(
        { success: false, error: result.error, raw: result.raw },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result, tokenLimit: TOKEN_LIMIT });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { loadHistoryAll } from "@/agent/idea";

// GET /api/history
// Returns { success: true, data: Record<accountId, HistoryEntry[]> }
export async function GET() {
  try {
    const data = loadHistoryAll();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load history" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const HISTORY_PATH = path.join(process.cwd(), "data", "history.json");

export async function GET() {
  try {
    if (!fs.existsSync(HISTORY_PATH)) {
      return NextResponse.json({ success: true, data: [] });
    }
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load history" },
      { status: 500 }
    );
  }
}
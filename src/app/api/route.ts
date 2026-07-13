import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Amazon VA Interview Lab",
    version: "1.0.0",
  });
}
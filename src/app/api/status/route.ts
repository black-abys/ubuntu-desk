import { NextResponse } from "next/server";
import { backendMode } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(backendMode());
}

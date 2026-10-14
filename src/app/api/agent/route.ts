import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { openedgeClient } from "@/lib/adapters";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await runAgent({ text: String(body.text ?? ""), lang: body.lang ?? "en", accountNo: body.accountNo ?? "JHB-4471-0093" });
  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json(await openedgeClient.listDisputes());
}

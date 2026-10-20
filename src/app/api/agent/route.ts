import { NextResponse } from "next/server";
import { openedgeClient } from "@/lib/adapters";
import { runAgent } from "@/lib/agent";
import { isLang } from "@/lib/languages";
import type { BillContext } from "@/lib/types";

export const dynamic = "force-dynamic";

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function billFrom(body: Record<string, unknown>): BillContext | null {
  const bill = body.bill;
  if (!bill || typeof bill !== "object") return null;
  const src = bill as Record<string, unknown>;
  return {
    accountNo: typeof src.accountNo === "string" ? src.accountNo.slice(0, 40) : null,
    holder: typeof src.holder === "string" ? src.holder.slice(0, 80) : null,
    period: typeof src.period === "string" ? src.period.slice(0, 20) : null,
    kwh: num(src.kwh),
    total: num(src.total),
    estimated: typeof src.estimated === "boolean" ? src.estimated : null,
    simulated: true,
    documentId: typeof src.documentId === "string" ? src.documentId.slice(0, 40) : null,
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  const requestedLang = typeof body.lang === "string" ? body.lang : null;
  const lang = isLang(requestedLang) ? requestedLang : "en";
  const result = await runAgent({
    text: String(body.text ?? "").slice(0, 2000),
    lang,
    accountNo: String(body.accountNo ?? "JHB-4471-0093").slice(0, 40),
    bill: billFrom(body),
  });
  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json(await openedgeClient.listDisputes());
}

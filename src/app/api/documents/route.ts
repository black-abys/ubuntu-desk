import { NextResponse } from "next/server";
import { documentStore, ocrClient, openedgeClient, ragClient } from "@/lib/adapters";
import { analyseAccount } from "@/lib/billing";
import type { BillContext, DocumentCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set<DocumentCategory>(["bill", "meter", "receipt", "infrastructure", "other"]);

function safePreview(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value)) return null;
  if (value.length > 400_000) return null;
  return value;
}

export async function GET() {
  return NextResponse.json(await documentStore.list());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Expected JSON" }, { status: 400 });

  const fileName = String(body.fileName ?? "upload").slice(0, 180);
  const mimeType = String(body.mimeType ?? "application/octet-stream").slice(0, 120);
  const category: DocumentCategory = CATEGORIES.has(body.category as DocumentCategory)
    ? (body.category as DocumentCategory)
    : "other";
  const useSample = body.useSample === true;
  const textSnippet = typeof body.textSnippet === "string" ? body.textSnippet.slice(0, 8000) : null;
  const isBill = category === "bill";
  const extraction = isBill ? await ocrClient.extract({ fileName, mimeType, useSample, textSnippet }) : null;

  let analysis = null;
  let citations = null;
  let remi = null;
  if (extraction) {
    const [account, rag] = await Promise.all([
      openedgeClient.getAccount(extraction.accountNo ?? "JHB-4471-0093"),
      ragClient.ask("Rules for estimated electricity readings and billing disputes"),
    ]);
    const bill: BillContext = {
      accountNo: extraction.accountNo,
      holder: extraction.holder,
      period: extraction.period,
      kwh: extraction.kwh,
      total: extraction.total,
      estimated: extraction.estimated,
      simulated: extraction.simulated,
    };
    analysis = analyseAccount({ account, bill, citations: rag.citations });
    citations = rag.citations;
    remi = rag.remi;
  }

  const byteSize = typeof body.byteSize === "number" && Number.isFinite(body.byteSize)
    ? Math.max(0, Math.min(body.byteSize, 20_000_000))
    : 0;

  const document = await documentStore.save({
    fileName: useSample ? "sample-municipal-bill.svg" : fileName,
    mimeType: useSample ? "image/svg+xml" : mimeType,
    category,
    byteSize,
    previewDataUrl: useSample ? null : safePreview(body.dataUrl),
    previewPath: useSample ? "/sample-bill.svg" : null,
    extraction,
    linkedDisputeId: null,
  });

  return NextResponse.json({ document, analysis, citations, remi, simulated: true });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as { documentId?: string; disputeId?: string } | null;
  if (!body?.documentId || !body?.disputeId) {
    return NextResponse.json({ error: "documentId and disputeId are required" }, { status: 400 });
  }
  try {
    const document = await documentStore.linkToCase(body.documentId, body.disputeId);
    await openedgeClient.updateDispute(body.disputeId, { documentId: document.documentId });
    return NextResponse.json({ document });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Link failed" }, { status: 400 });
  }
}

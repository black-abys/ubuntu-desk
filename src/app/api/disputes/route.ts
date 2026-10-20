import { NextResponse } from "next/server";
import { documentStore, openedgeClient } from "@/lib/adapters";
import { isLang } from "@/lib/languages";
import type { DisputeStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES = new Set<DisputeStatus>(["draft", "submitted", "under_review", "resolved"]);

export async function GET() {
  return NextResponse.json(await openedgeClient.listDisputes());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  if (body.confirmed !== true) {
    return NextResponse.json(
      { error: "Resident confirmation is required before a dispute is submitted." },
      { status: 400 },
    );
  }
  if (typeof body.accountNo !== "string" || typeof body.reason !== "string" || typeof body.amountDisputed !== "number") {
    return NextResponse.json({ error: "Account, reason, and amount are required." }, { status: 400 });
  }
  const requestedLang = typeof body.language === "string" ? body.language : null;
  const language = isLang(requestedLang) ? requestedLang : "en";
  const documentId = typeof body.documentId === "string" ? body.documentId : null;
  const dispute = await openedgeClient.createDispute({
    accountNo: body.accountNo.slice(0, 40),
    reason: body.reason.slice(0, 500),
    amountDisputed: body.amountDisputed,
    language,
    status: "submitted",
    documentId,
  });
  if (documentId) {
    try {
      await documentStore.linkToCase(documentId, dispute.disputeId);
    } catch {
      /* The draft may not have a vault file. The dispute is still submitted. */
    }
  }
  return NextResponse.json(dispute);
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as { disputeId?: string; status?: DisputeStatus } | null;
  if (!body?.disputeId || !body.status || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "disputeId and status are required" }, { status: 400 });
  }
  try {
    const dispute = await openedgeClient.updateDispute(body.disputeId, { status: body.status });
    return NextResponse.json(dispute);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 400 });
  }
}

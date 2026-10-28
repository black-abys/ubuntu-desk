import { NextResponse } from "next/server";
import { documentStore, openedgeClient } from "@/lib/adapters";
import { analyseAccount, formatRand, roundMoney } from "@/lib/billing";
import { isLang } from "@/lib/languages";
import { backendMode } from "@/lib/mode";
import type { Dispute, DisputeStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES = new Set<DisputeStatus>(["draft", "submitted", "under_review", "resolved"]);

function present(dispute: Dispute): Dispute {
  const simulated = backendMode().openedge === "simulated" ? true : dispute.simulated === true;
  return { ...dispute, simulated };
}

export async function GET() {
  const disputes = await openedgeClient.listDisputes();
  return NextResponse.json(disputes.map(present));
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
  if (typeof body.accountNo !== "string" || !body.accountNo.trim() || typeof body.reason !== "string" || !body.reason.trim()) {
    return NextResponse.json({ error: "Account and reason are required." }, { status: 400 });
  }
  if (typeof body.amountDisputed !== "number" || !Number.isFinite(body.amountDisputed)) {
    return NextResponse.json({ error: "Dispute amount must be a finite number." }, { status: 400 });
  }
  if (body.amountDisputed <= 0) {
    return NextResponse.json({ error: "Dispute amount must be greater than zero." }, { status: 400 });
  }

  const lookup = await openedgeClient.getAccount(body.accountNo.slice(0, 40));
  if (!lookup.found) {
    return NextResponse.json({ error: `Account not found: ${lookup.accountNo}` }, { status: 400 });
  }

  const overcharge = analyseAccount({ account: lookup.account, citations: [] }).overcharge;
  const amount = roundMoney(body.amountDisputed);
  if (amount > overcharge) {
    return NextResponse.json(
      {
        error: `Dispute amount cannot exceed the calculated potential overcharge of ${formatRand(overcharge)} for this account.`,
      },
      { status: 400 },
    );
  }

  const requestedLang = typeof body.language === "string" ? body.language : null;
  const language = isLang(requestedLang) ? requestedLang : "en";
  const documentId = typeof body.documentId === "string" ? body.documentId : null;
  const dispute = await openedgeClient.createDispute({
    accountNo: lookup.account.accountNo,
    reason: body.reason.slice(0, 500),
    amountDisputed: amount,
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
  return NextResponse.json(present(dispute));
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as { disputeId?: string; status?: DisputeStatus } | null;
  if (!body?.disputeId || !body.status || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "disputeId and status are required" }, { status: 400 });
  }
  try {
    const dispute = await openedgeClient.updateDispute(body.disputeId, { status: body.status });
    return NextResponse.json(present(dispute));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 400 });
  }
}

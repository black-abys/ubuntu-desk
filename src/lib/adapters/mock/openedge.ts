import type { Account, Dispute, DisputeStatus, OpenEdgeClient } from "@/lib/types";

const accounts: Record<string, Account> = {
  "JHB-4471-0093": {
    accountNo: "JHB-4471-0093",
    holder: "N. Dlamini",
    ward: "Ward 112, Soweto",
    meterType: "conventional",
    tariffCode: "RES-STD-2026",
    source: "simulated",
    readings: [
      { period: "2026-07", kwh: 410, billed: 1248.5, estimated: false },
      { period: "2026-08", kwh: 395, billed: 1203.4, estimated: false },
      { period: "2026-09", kwh: 1020, billed: 3107.0, estimated: true },
    ],
  },
};

const disputes: Dispute[] = [
  {
    disputeId: "DEMO-DSP-20931",
    accountNo: "JHB-1102-7781",
    reason: "Duplicate refuse charge",
    amountDisputed: 312,
    status: "under_review",
    createdAt: "2026-10-12T09:14:00+02:00",
    language: "en",
    documentId: null,
    simulated: true,
  },
  {
    disputeId: "DEMO-DSP-20944",
    accountNo: "JHB-3390-1204",
    reason: "Estimated water reading",
    amountDisputed: 860,
    status: "submitted",
    createdAt: "2026-10-13T15:40:00+02:00",
    language: "st",
    documentId: null,
    simulated: true,
  },
  {
    disputeId: "DEMO-DSP-20951",
    accountNo: "JHB-5521-0042",
    reason: "Wrong tariff band",
    amountDisputed: 1490,
    status: "resolved",
    createdAt: "2026-10-13T17:02:00+02:00",
    language: "zu",
    documentId: null,
    simulated: true,
  },
];
let seq = 20960;

const NEXT: Partial<Record<DisputeStatus, DisputeStatus>> = {
  draft: "submitted",
  submitted: "under_review",
  under_review: "resolved",
};

export const mockOpenEdge: OpenEdgeClient = {
  async getAccount(no) {
    const accountNo = no.trim().toUpperCase();
    const account = accounts[accountNo];
    if (!account) {
      return { found: false, accountNo: accountNo || no.trim(), error: "account not found" };
    }
    return { found: true, account: structuredClone(account) };
  },
  async createDispute(d) {
    const rec: Dispute = {
      ...d,
      disputeId: `DEMO-DSP-${++seq}`,
      simulated: true,
      status: d.status ?? "submitted",
      createdAt: new Date().toISOString(),
      documentId: d.documentId ?? null,
    };
    disputes.unshift(rec);
    return rec;
  },
  async updateDispute(disputeId, patch) {
    const rec = disputes.find((d) => d.disputeId === disputeId);
    if (!rec) throw new Error(`No simulated dispute ${disputeId}`);
    if (patch.status && patch.status !== rec.status && NEXT[rec.status] !== patch.status) {
      throw new Error(`Simulated lifecycle cannot move ${rec.status} to ${patch.status}`);
    }
    if (patch.status) rec.status = patch.status;
    if (patch.documentId !== undefined) rec.documentId = patch.documentId;
    return { ...rec };
  },
  async listDisputes() {
    return disputes.map((d) => ({ ...d }));
  },
};

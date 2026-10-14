import type { Account, Dispute, OpenEdgeClient } from "@/lib/types";

const accounts: Record<string, Account> = {
  "JHB-4471-0093": {
    accountNo: "JHB-4471-0093",
    holder: "N. Dlamini",
    ward: "Ward 112, Soweto",
    meterType: "conventional",
    tariffCode: "RES-STD-2026",
    readings: [
      { period: "2026-07", kwh: 410, billed: 1248.5, estimated: false },
      { period: "2026-08", kwh: 395, billed: 1203.4, estimated: false },
      { period: "2026-09", kwh: 1020, billed: 3107.0, estimated: true },
    ],
  },
};

const disputes: Dispute[] = [
  { disputeId: "DSP-20931", accountNo: "JHB-1102-7781", reason: "Duplicate refuse charge", amountDisputed: 312, status: "UNDER_REVIEW", createdAt: "2026-10-12T09:14:00+02:00", language: "en" },
  { disputeId: "DSP-20944", accountNo: "JHB-3390-1204", reason: "Estimated water reading", amountDisputed: 860, status: "OPEN", createdAt: "2026-10-13T15:40:00+02:00", language: "st" },
  { disputeId: "DSP-20951", accountNo: "JHB-5521-0042", reason: "Wrong tariff band", amountDisputed: 1490, status: "RESOLVED", createdAt: "2026-10-13T17:02:00+02:00", language: "zu" },
];
let seq = 20960;

export const mockOpenEdge: OpenEdgeClient = {
  async getAccount(no) {
    const a = accounts[no] ?? accounts["JHB-4471-0093"];
    return structuredClone(a);
  },
  async createDispute(d) {
    const rec: Dispute = { ...d, disputeId: `DSP-${++seq}`, status: "OPEN", createdAt: new Date().toISOString() };
    disputes.unshift(rec);
    return rec;
  },
  async listDisputes() {
    return [...disputes];
  },
};

import type { OpenEdgeClient } from "@/lib/types";

/**
 * OpenEdge PASOE REST adapter scaffold.
 * Expected env: OPENEDGE_BASE_URL, OPENEDGE_TOKEN.
 * Do not commit tokens. Leave USE_REAL_OPENEDGE unset until a tested connection exists.
 */
const base = process.env.OPENEDGE_BASE_URL ?? "";
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.OPENEDGE_TOKEN ?? ""}`,
});

function assertConfigured() {
  if (!base) throw new Error("OPENEDGE_BASE_URL is not set");
}

export const pasoeOpenEdge: OpenEdgeClient = {
  async getAccount(no) {
    assertConfigured();
    const r = await fetch(`${base}/accounts/${encodeURIComponent(no)}`, { headers: headers() });
    if (!r.ok) throw new Error(`OpenEdge getAccount ${r.status}`);
    return r.json();
  },
  async createDispute(d) {
    assertConfigured();
    const r = await fetch(`${base}/disputes`, { method: "POST", headers: headers(), body: JSON.stringify(d) });
    if (!r.ok) throw new Error(`OpenEdge createDispute ${r.status}`);
    return r.json();
  },
  async updateDispute(disputeId, patch) {
    assertConfigured();
    const r = await fetch(`${base}/disputes/${encodeURIComponent(disputeId)}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`OpenEdge updateDispute ${r.status}`);
    return r.json();
  },
  async listDisputes() {
    assertConfigured();
    const r = await fetch(`${base}/disputes`, { headers: headers() });
    if (!r.ok) throw new Error(`OpenEdge listDisputes ${r.status}`);
    return r.json();
  },
};

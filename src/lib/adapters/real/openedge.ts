import type { OpenEdgeClient } from "@/lib/types";

/**
 * OpenEdge PASOE REST adapter (fill in after the 19 Oct starter kit).
 * Expected env: OPENEDGE_BASE_URL (e.g. https://host:8810/ubuntudesk/rest/ubuntudesk), OPENEDGE_TOKEN.
 * Map these to your ABL business entities / REST services.
 */
const base = process.env.OPENEDGE_BASE_URL ?? "";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENEDGE_TOKEN ?? ""}` });

export const pasoeOpenEdge: OpenEdgeClient = {
  async getAccount(no) {
    const r = await fetch(`${base}/accounts/${encodeURIComponent(no)}`, { headers: headers() });
    if (!r.ok) throw new Error(`OpenEdge getAccount ${r.status}`);
    return r.json();
  },
  async createDispute(d) {
    const r = await fetch(`${base}/disputes`, { method: "POST", headers: headers(), body: JSON.stringify(d) });
    if (!r.ok) throw new Error(`OpenEdge createDispute ${r.status}`);
    return r.json();
  },
  async listDisputes() {
    const r = await fetch(`${base}/disputes`, { headers: headers() });
    if (!r.ok) throw new Error(`OpenEdge listDisputes ${r.status}`);
    return r.json();
  },
};

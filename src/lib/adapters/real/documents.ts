import type { DocumentStore } from "@/lib/types";

/**
 * Object-storage scaffold for a future private document vault.
 * Expected env: DOCUMENT_STORE_URL, DOCUMENT_STORE_TOKEN.
 * Leave USE_REAL_DOCUMENTS unset until storage, signed URLs, and malware scanning exist.
 * Do not commit tokens.
 */
function root(): string {
  const url = process.env.DOCUMENT_STORE_URL;
  if (!url) throw new Error("DOCUMENT_STORE_URL is not set");
  return url.replace(/\/$/, "");
}

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.DOCUMENT_STORE_TOKEN ?? ""}`,
});

export const remoteDocumentStore: DocumentStore = {
  async save(doc) {
    const r = await fetch(`${root()}/documents`, { method: "POST", headers: headers(), body: JSON.stringify(doc) });
    if (!r.ok) throw new Error(`Document store save ${r.status}`);
    return r.json();
  },
  async list() {
    const r = await fetch(`${root()}/documents`, { headers: headers() });
    if (!r.ok) throw new Error(`Document store list ${r.status}`);
    return r.json();
  },
  async linkToCase(documentId, disputeId) {
    const r = await fetch(`${root()}/documents/${encodeURIComponent(documentId)}/link`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ disputeId }),
    });
    if (!r.ok) throw new Error(`Document store link ${r.status}`);
    return r.json();
  },
};

import type { DocumentStore, VaultDocument } from "@/lib/types";

const documents: VaultDocument[] = [];
let seq = 1000;

/** Process-local vault. Lost on restart. Not municipal object storage. */
export const memoryDocumentStore: DocumentStore = {
  async save(doc) {
    const rec: VaultDocument = {
      ...doc,
      documentId: `DOC-${++seq}`,
      createdAt: new Date().toISOString(),
    };
    documents.unshift(rec);
    return rec;
  },
  async list() {
    return documents.map((d) => ({ ...d }));
  },
  async linkToCase(documentId, disputeId) {
    const rec = documents.find((d) => d.documentId === documentId);
    if (!rec) throw new Error(`No simulated document ${documentId}`);
    rec.linkedDisputeId = disputeId;
    return { ...rec };
  },
};

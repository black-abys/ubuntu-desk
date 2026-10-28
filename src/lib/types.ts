export const SA_LANGS = ["en", "zu", "xh", "af", "nso", "st", "tn", "ts", "ss", "ve", "nr"] as const;
export type Lang = (typeof SA_LANGS)[number];

export type DisputeStatus = "draft" | "submitted" | "under_review" | "resolved";

export interface Account {
  accountNo: string;
  holder: string;
  ward: string;
  meterType: "prepaid" | "conventional";
  tariffCode: string;
  readings: { period: string; kwh: number; billed: number; estimated: boolean }[];
  /** Present on the demo adapter. Live payloads may omit it. */
  source?: "simulated" | "openedge";
}

export interface Dispute {
  disputeId: string;
  accountNo: string;
  reason: string;
  amountDisputed: number;
  status: DisputeStatus;
  createdAt: string;
  language: Lang;
  documentId?: string | null;
  /** True when the case lives only in the demo adapter. */
  simulated: boolean;
}

export interface Citation {
  docTitle: string;
  clause: string;
  text: string;
  page?: number;
}

export interface RagAnswer {
  answer: string;
  citations: Citation[];
  /** REMi-style retrieval scores, 0..1. Not a speech or translation score. */
  remi: { answerRelevance: number; contextRelevance: number; groundedness: number };
  simulated?: boolean;
}

export type AccountLookup =
  | { found: true; account: Account }
  | { found: false; accountNo: string; error: "account not found" };

/** System of record: PASOE REST when a tested OpenEdge connection exists. */
export interface OpenEdgeClient {
  getAccount(accountNo: string): Promise<AccountLookup>;
  createDispute(
    d: Omit<Dispute, "disputeId" | "createdAt" | "simulated"> & { status?: DisputeStatus },
  ): Promise<Dispute>;
  updateDispute(
    disputeId: string,
    patch: { status?: DisputeStatus; documentId?: string | null },
  ): Promise<Dispute>;
  listDisputes(): Promise<Dispute[]>;
}

/** Knowledge layer: Progress Agentic RAG when a tested Knowledge Box exists. */
export interface RagClient {
  ask(question: string, opts?: { lang?: Lang }): Promise<RagAnswer>;
}

export type DocumentCategory = "bill" | "meter" | "receipt" | "infrastructure" | "other";

/** How the demo filled the fields. Unread files are not transcribed. */
export type OcrBasis = "sample-bill" | "file-text" | "unread-file";

export interface OcrExtraction {
  provider: "simulated" | "remote";
  /** True until a real OCR provider is plugged in and has read the file. */
  simulated: boolean;
  basis: OcrBasis;
  accountNo: string | null;
  holder: string | null;
  period: string | null;
  kwh: number | null;
  total: number | null;
  estimated: boolean | null;
  /**
   * Confidence that the simulated extractor matched fields.
   * Null when the file was not read. Never a groundedness or trust score.
   */
  fieldConfidence: number | null;
  note: string;
}

export interface OcrRequest {
  fileName: string;
  mimeType: string;
  useSample?: boolean;
  textSnippet?: string | null;
}

/** Pluggable OCR. The demo implementation never claims to read pixels. */
export interface OcrClient {
  extract(input: OcrRequest): Promise<OcrExtraction>;
}

export interface VaultDocument {
  documentId: string;
  fileName: string;
  mimeType: string;
  category: DocumentCategory;
  createdAt: string;
  byteSize: number;
  /** Raster preview only (png/jpeg/webp). SVG and PDF are not inlined. */
  previewDataUrl: string | null;
  previewPath: string | null;
  extraction: OcrExtraction | null;
  linkedDisputeId: string | null;
}

export interface DocumentInput {
  fileName: string;
  mimeType: string;
  category: DocumentCategory;
  byteSize: number;
  previewDataUrl: string | null;
  previewPath: string | null;
  extraction: OcrExtraction | null;
  linkedDisputeId: string | null;
}

/** Pluggable document vault. The demo keeps documents in server memory. */
export interface DocumentStore {
  save(doc: DocumentInput): Promise<VaultDocument>;
  list(): Promise<VaultDocument[]>;
  linkToCase(documentId: string, disputeId: string): Promise<VaultDocument>;
}

export interface BillContext {
  accountNo: string | null;
  holder: string | null;
  period: string | null;
  kwh: number | null;
  total: number | null;
  estimated: boolean | null;
  simulated: boolean;
  documentId?: string | null;
}

export interface CalcStep {
  id: string;
  label: string;
  detail: string;
  source: string;
  cite?: string;
}

export type FindingLabel =
  | "potential billing error"
  | "no potential error in these figures"
  | "needs reconciliation";

export interface BillAnalysis {
  simulatedRecords: true;
  ocrSimulated: boolean;
  usedBill: boolean;
  finding: FindingLabel;
  caution: string;
  steps: CalcStep[];
  expected: number;
  billed: number;
  overcharge: number;
  isPotentialError: boolean;
  period: string;
  accountNo: string;
  billAccountNo: string | null;
  accountMismatch: boolean;
}

export type StepKind = "listen" | "translate" | "retrieve" | "lookup" | "reason" | "act" | "reply";

export interface AgentStep {
  kind: StepKind;
  title: string;
  detail: string;
  ms: number;
}

export interface DisputeDraft {
  accountNo: string;
  reason: string;
  amountDisputed: number;
  language: Lang;
  documentId: string | null;
}

export interface AgentResult {
  transcript: string;
  lang: Lang;
  /** full = a demo script exists (reviewed or machine-translated); stub = English placeholder. */
  support: "full" | "stub";
  simulated: true;
  steps: AgentStep[];
  /** Null when the message was not a billing query, or the account was not found. */
  account: Account | null;
  rag: RagAnswer;
  /** Null when no billing investigation was run. */
  analysis: BillAnalysis | null;
  draft: DisputeDraft | null;
  dispute: Dispute | null;
  reply: string;
  replyMode: "demo-script" | "coming-soon";
}

export type BackendFlag = "simulated" | "real-unverified";

export interface BackendMode {
  openedge: BackendFlag;
  rag: BackendFlag;
  ocr: BackendFlag;
  documents: BackendFlag;
}

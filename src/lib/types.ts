export type Lang = "zu" | "st" | "en";

export interface Account {
  accountNo: string;
  holder: string;
  ward: string;
  meterType: "prepaid" | "conventional";
  tariffCode: string;
  readings: { period: string; kwh: number; billed: number; estimated: boolean }[];
}

export interface Dispute {
  disputeId: string;
  accountNo: string;
  reason: string;
  amountDisputed: number;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  createdAt: string;
  language: Lang;
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
  /** REMi-style scores, 0..1 */
  remi: { answerRelevance: number; contextRelevance: number; groundedness: number };
}

/** System of record: implemented by OpenEdge PASOE REST after 19 Oct. */
export interface OpenEdgeClient {
  getAccount(accountNo: string): Promise<Account>;
  createDispute(d: Omit<Dispute, "disputeId" | "createdAt" | "status">): Promise<Dispute>;
  listDisputes(): Promise<Dispute[]>;
}

/** Knowledge layer: implemented by Progress Agentic RAG after 19 Oct. */
export interface RagClient {
  ask(question: string, opts?: { lang?: Lang }): Promise<RagAnswer>;
}

export type StepKind = "listen" | "translate" | "retrieve" | "lookup" | "reason" | "act" | "reply";
export interface AgentStep {
  kind: StepKind;
  title: string;
  detail: string;
  ms: number;
}

export interface AgentResult {
  transcript: string;
  lang: Lang;
  steps: AgentStep[];
  account: Account;
  rag: RagAnswer;
  finding: { isError: boolean; expected: number; billed: number; overcharge: number; explanation: string };
  dispute: Dispute | null;
  reply: string;
}

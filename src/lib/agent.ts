import { openedgeClient, ragClient } from "./adapters";
import { analyseAccount, formatRand } from "./billing";
import { DEMO_ACCOUNT_NO } from "./demo";
import { helpReply, isBillingQuery, missingAccountReply } from "./intent";
import { languageByCode } from "./languages";
import { backendMode } from "./mode";
import { draftReason, findingReply, noErrorReply } from "./scripts";
import type { Account, AgentResult, AgentStep, BillAnalysis, BillContext, DisputeDraft, Lang, RagAnswer } from "./types";

const NO_RAG: RagAnswer = {
  answer: "",
  citations: [],
  remi: { answerRelevance: 0, contextRelevance: 0, groundedness: 0 },
  simulated: true,
};

function comingSoonReply(lang: Lang, summary: string): string {
  const name = languageByCode(lang).label;
  return `Coming soon for ${name}. Ubuntu Desk does not yet have a reviewed ${name} reply or a voice response in that language, so this is not a translation. ${summary}`;
}

function resultOf(input: {
  text: string;
  lang: Lang;
  support: AgentResult["support"];
  steps: AgentStep[];
  account: Account | null;
  rag: RagAnswer;
  analysis: BillAnalysis | null;
  draft: DisputeDraft | null;
  reply: string;
  replyMode: AgentResult["replyMode"];
}): AgentResult {
  return {
    transcript: input.text,
    lang: input.lang,
    support: input.support,
    simulated: true,
    steps: input.steps,
    account: input.account,
    rag: input.rag,
    analysis: input.analysis,
    draft: input.draft,
    dispute: null,
    reply: input.reply,
    replyMode: input.replyMode,
  };
}

export async function runAgent(input: {
  text: string;
  lang: Lang;
  accountNo: string;
  bill?: BillContext | null;
}): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const started = () => Date.now();
  let mark = started();
  const step = (kind: AgentStep["kind"], title: string, detail: string) => {
    steps.push({ kind, title, detail, ms: Date.now() - mark });
    mark = Date.now();
  };

  const info = languageByCode(input.lang);
  const support = info.support;

  step("listen", "Heard the resident", `“${input.text || "(empty message)"}”`);

  if (!isBillingQuery(input.text)) {
    const help = helpReply(input.lang);
    step(
      "reply",
      help.replyMode === "demo-script" ? "Replied with what the desk can help with" : "Placeholder reply only",
      "The message is not about a bill or an account, so no account was loaded and no billing finding was made.",
    );
    return resultOf({
      text: input.text,
      lang: input.lang,
      support,
      steps,
      account: null,
      rag: NO_RAG,
      analysis: null,
      draft: null,
      reply: help.reply,
      replyMode: help.replyMode,
    });
  }

  if (info.translation === "machine") {
    step(
      "translate",
      "Understood the demo intent",
      `${info.label} · machine-translated demo script, pending native-speaker review. Intent: billing query (electricity, high bill). This step is rule-based, not a live model.`,
    );
  } else if (support === "full") {
    step(
      "translate",
      "Understood the demo intent",
      `${info.label} · intent: billing query (electricity, high bill). This step is rule-based, not a live model.`,
    );
  } else {
    step(
      "translate",
      "Language not fully wired",
      `${info.label} can be selected, but there is no reviewed translation. The rest of this run stays an English placeholder.`,
    );
  }

  const lookup = await openedgeClient.getAccount(input.accountNo);
  if (!lookup.found) {
    const missing = missingAccountReply(input.lang, lookup.accountNo);
    step(
      "lookup",
      "Account not found",
      `No simulated OpenEdge account for ${lookup.accountNo}. The demo account is ${DEMO_ACCOUNT_NO}.`,
    );
    step("reply", "Told the resident the account was not found", "No billing finding was made.");
    return resultOf({
      text: input.text,
      lang: input.lang,
      support,
      steps,
      account: null,
      rag: NO_RAG,
      analysis: null,
      draft: null,
      reply: missing.reply,
      replyMode: missing.replyMode,
    });
  }

  const account = lookup.account;
  const rag = await ragClient.ask("Rules for estimated electricity readings and billing disputes", { lang: input.lang });

  step(
    "lookup",
    "Fetched a simulated account record",
    `${account.accountNo} · ${account.tariffCode} · ${account.readings.length} readings · demo OpenEdge adapter`,
  );
  step(
    "retrieve",
    "Retrieved demo policy clauses",
    `${rag.citations.length} cited clauses · retrieval groundedness ${Math.round(rag.remi.groundedness * 100)}%. That score is not speech confidence and not proof of a translation.`,
  );

  const analysis = analyseAccount({ account, bill: input.bill, citations: rag.citations });
  step("reason", "Cross-checked figures against the cited cap", analysis.steps.find((s) => s.id === "result")?.detail ?? analysis.caution);

  const amount = formatRand(analysis.overcharge);
  const draft = analysis.isPotentialError
    ? {
        accountNo: account.accountNo,
        reason: draftReason(input.lang, analysis.period),
        amountDisputed: analysis.overcharge,
        language: input.lang,
        documentId: input.bill?.documentId ?? null,
      }
    : null;

  if (draft) {
    step("act", "Prepared a dispute draft", "Not submitted. The resident must confirm before anything is written.");
  } else {
    step("act", "No dispute draft", "Nothing to submit from these figures.");
  }

  const englishSummary = analysis.isPotentialError
    ? `English demo summary: simulated records show a potential billing error of ${amount}. This is not confirmed.`
    : analysis.accountMismatch
      ? "English demo summary: the bill account does not match the looked-up account, so no dispute was drafted."
      : "English demo summary: these simulated figures do not show a potential billing error.";

  const reviewedScript = info.translation !== "machine" && support === "full" && (analysis.isPotentialError || input.lang === "en");
  const machineScript = info.translation === "machine";
  const reply = machineScript
    ? analysis.isPotentialError
      ? findingReply(input.lang, amount)
      : noErrorReply(input.lang)
    : !reviewedScript
      ? comingSoonReply(input.lang, input.lang === "en" ? "Hi! On these simulated figures I do not see a potential billing error. Nothing has been submitted." : englishSummary)
      : analysis.isPotentialError
        ? findingReply(input.lang, amount)
        : "Hi! On these simulated figures I do not see a potential billing error. Nothing has been submitted.";
  const replyMode = machineScript || reviewedScript ? "demo-script" : "coming-soon";

  step(
    "reply",
    replyMode === "demo-script" ? "Replied with the demo script" : "Placeholder reply only",
    replyMode !== "demo-script"
      ? `No reviewed ${info.label} reply for this outcome. Nothing fluent is generated.`
      : machineScript
        ? `${info.label} machine-translated text, pending native-speaker review. Speech uses ${info.bcp} when the browser has that voice, otherwise an English voice.`
        : `${info.label} text. Speech plays in the browser when it allows ${info.bcp}.`,
  );

  return resultOf({
    text: input.text,
    lang: input.lang,
    support,
    steps,
    account,
    rag: { ...rag, simulated: rag.simulated === true || backendMode().rag === "simulated" },
    analysis,
    draft,
    reply,
    replyMode,
  });
}

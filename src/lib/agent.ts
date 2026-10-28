import { openedgeClient, ragClient } from "@/lib/adapters";
import { analyseAccount, formatRand } from "@/lib/billing";
import { DEMO_ACCOUNT_NO } from "@/lib/demo";
import { helpReply, isBillingQuery, missingAccountReply } from "@/lib/intent";
import { languageByCode } from "@/lib/languages";
import { backendMode } from "@/lib/mode";
import type { Account, AgentResult, AgentStep, BillAnalysis, BillContext, DisputeDraft, Lang, RagAnswer } from "@/lib/types";

const replies: Record<"en" | "zu" | "st", (amount: string) => string> = {
  zu: (amount) =>
    `Sawubona! Ngibona iphutha elingaba khona: ukufundwa kukaSeptemba bekuqagelwa futhi kudlula umkhawulo ka-20%. Umehluko kule demo ngu-${amount}. Lokhu akuqinisekisiwe — qinisekisa ngezansi ukuze uthumele isikhalazo.`,
  st: (amount) =>
    `Dumela! Ke bona phoso e ka bang teng: palo ya Loetse e ne e hakanngwa mme e feta moedi wa 20%. Phapang demo ena ke ${amount}. Ha e so netefatsoe — netefatsa ka tlase pele o romela tletlebo.`,
  en: (amount) =>
    `Hi! Simulated records show a potential billing error: the September reading was estimated and is above the 20% cap in the by-law. The difference on this demo account is ${amount}. This is not confirmed until municipal records agree. Confirm below if you want a dispute submitted.`,
};

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

  if (support === "full") {
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
        reason: `Estimated reading appears to exceed the 20% cap (§14.3) for ${analysis.period}`,
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

  const reviewedScript = support === "full" && (analysis.isPotentialError || input.lang === "en");
  const reply = !reviewedScript
    ? comingSoonReply(input.lang, input.lang === "en" ? "Hi! On these simulated figures I do not see a potential billing error. Nothing has been submitted." : englishSummary)
    : analysis.isPotentialError
      ? replies[input.lang as "en" | "zu" | "st"](amount)
      : "Hi! On these simulated figures I do not see a potential billing error. Nothing has been submitted.";

  step(
    "reply",
    reviewedScript ? "Replied with the demo script" : "Placeholder reply only",
    reviewedScript
      ? `${info.label} text. Speech plays in the browser when it allows ${info.bcp}.`
      : `No reviewed ${info.label} reply for this outcome. Nothing fluent is generated.`,
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
    replyMode: reviewedScript ? "demo-script" : "coming-soon",
  });
}

import { openedgeClient, ragClient } from "@/lib/adapters";
import { analyseAccount, formatRand } from "@/lib/billing";
import { languageByCode } from "@/lib/languages";
import { backendMode } from "@/lib/mode";
import type { AgentResult, AgentStep, BillContext, Lang } from "@/lib/types";

const replies: Record<"en" | "zu" | "st", (amount: string) => string> = {
  zu: (amount) =>
    `Sawubona! Ngibona iphutha elingaba khona: ukufundwa kukaSeptemba bekuqagelwa futhi kudlula umkhawulo ka-20%. Umehluko kule demo ngu-${amount}. Lokhu akuqinisekisiwe — qinisekisa ngezansi ukuze uthumele isikhalazo.`,
  st: (amount) =>
    `Dumela! Ke bona phoso e ka bang teng: palo ya Loetse e ne e hakanngwa mme e feta moedi wa 20%. Phapang demo ena ke ${amount}. Ha e so netefatsoe — netefatsa ka tlase pele o romela tletlebo.`,
  en: (amount) =>
    `Hi! Simulated records show a potential billing error: the September reading was estimated and is above the 20% cap in the by-law. The difference on this demo account is ${amount}. This is not confirmed until municipal records agree. Confirm below if you want a dispute submitted.`,
};

function comingSoonReply(lang: Lang, summary: string): string {
  const name = languageByCode(lang).label;
  return `Coming soon for ${name}. Ubuntu Desk does not yet have a reviewed ${name} reply or a voice response in that language, so this is not a translation. ${summary}`;
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

  const [account, rag] = await Promise.all([
    openedgeClient.getAccount(input.accountNo),
    ragClient.ask("Rules for estimated electricity readings and billing disputes", { lang: input.lang }),
  ]);

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

  return {
    transcript: input.text,
    lang: input.lang,
    support,
    simulated: true,
    steps,
    account,
    rag: { ...rag, simulated: rag.simulated === true || backendMode().rag === "simulated" },
    analysis,
    draft,
    dispute: null,
    reply,
    replyMode: reviewedScript ? "demo-script" : "coming-soon",
  };
}

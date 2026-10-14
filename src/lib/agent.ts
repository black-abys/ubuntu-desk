import { openedgeClient, ragClient } from "@/lib/adapters";
import type { AgentResult, AgentStep, Lang } from "@/lib/types";

const RATE = 3.05; // R/kWh blended, RES-STD-2026 (mock)

const replies: Record<Lang, (o: number, id: string) => string> = {
  zu: (o, id) => `Sawubona! Ngibone iphutha: ukufundwa kukaSeptemba bekuqagelwa futhi kudlula umkhawulo ka-20%. Ukhokhiswe ngaphezu ngo-R${o.toFixed(2)}. Ngivule isikhalazo ${id} — ukuqoqwa kwalesi samba kumisiwe kuze kuxazululwe.`,
  st: (o, id) => `Dumela! Ke fumane phoso: palo ya Loetse e ne e hakanngwa mme e feta moedi wa 20%. O lefisitswe ho feta ka R${o.toFixed(2)}. Ke butse tletlebo ${id} — pokello ya tjhelete ena e emisitswe.`,
  en: (o, id) => `Hi! I found an error: your September reading was estimated and exceeds the 20% cap in the by-law. You were overcharged R${o.toFixed(2)}. I've opened dispute ${id} — collection on this amount is suspended until it's resolved.`,
};

export async function runAgent(input: { text: string; lang: Lang; accountNo: string }): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const t = () => Date.now();
  let s = t();
  const step = (kind: AgentStep["kind"], title: string, detail: string) => { steps.push({ kind, title, detail, ms: t() - s }); s = t(); };

  step("listen", "Heard the citizen", `“${input.text}”`);
  step("translate", "Understood intent", `Language: ${input.lang.toUpperCase()} → intent: billing_query (electricity, high bill)`);

  const account = await openedgeClient.getAccount(input.accountNo);
  step("lookup", "Fetched OpenEdge account record", `${account.accountNo} · ${account.tariffCode} · ${account.readings.length} readings`);

  const rag = await ragClient.ask("Rules for estimated electricity readings and billing disputes", { lang: input.lang });
  step("retrieve", "Retrieved policy via Agentic RAG", `${rag.citations.length} cited clauses · groundedness ${(rag.remi.groundedness * 100).toFixed(0)}%`);

  const actual = account.readings.filter((r) => !r.estimated);
  const avg = actual.reduce((a, r) => a + r.kwh, 0) / actual.length;
  const latest = account.readings[account.readings.length - 1];
  const capKwh = avg * 1.2;
  const isError = latest.estimated && latest.kwh > capKwh;
  const expected = +(capKwh * RATE).toFixed(2);
  const overcharge = isError ? +(latest.billed - expected).toFixed(2) : 0;
  const explanation = `Avg of actual readings ${avg.toFixed(0)} kWh → cap ${capKwh.toFixed(0)} kWh. ${latest.period} estimate ${latest.kwh} kWh ${isError ? "exceeds" : "within"} cap (§14.3).`;
  step("reason", "Cross-checked bill against by-law", explanation);

  let dispute = null;
  if (isError) {
    dispute = await openedgeClient.createDispute({ accountNo: account.accountNo, reason: `Estimated reading exceeds 20% cap (§14.3) for ${latest.period}`, amountDisputed: overcharge, language: input.lang });
    step("act", "Created dispute in OpenEdge", `${dispute.disputeId} · R${overcharge.toFixed(2)} · status OPEN`);
  }
  const reply = replies[input.lang](overcharge, dispute?.disputeId ?? "-");
  step("reply", "Replied in citizen's language", input.lang === "en" ? "English text + speech" : "Translated text + speech");

  return { transcript: input.text, lang: input.lang, steps, account, rag, finding: { isError, expected, billed: latest.billed, overcharge, explanation }, dispute, reply };
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AgentResult, Dispute, Lang } from "@/lib/types";

const SAMPLES: Record<Lang, { label: string; text: string; bcp: string }> = {
  zu: { label: "isiZulu", bcp: "zu-ZA", text: "Sawubona, kungani ibhili yami kagesi ingu-R3,107 kulenyanga? Imvamisa ngikhokha cishe u-R1,200." },
  st: { label: "Sesotho", bcp: "st-ZA", text: "Dumela, hobaneng bili ya ka ya motlakase e le R3,107 kgweding ena? Hangata ke lefa R1,200 feela." },
  en: { label: "English", bcp: "en-ZA", text: "Hi, why is my electricity bill R3,107 this month? I normally pay about R1,200." },
};

const ICON: Record<string, string> = { listen: "🎙", translate: "🌍", lookup: "🗄", retrieve: "📚", reason: "🧠", act: "⚡", reply: "💬" };

export default function Desk() {
  const params = useSearchParams();
  const [lang, setLang] = useState<Lang>("zu");
  const [text, setText] = useState(SAMPLES.zu.text);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [shown, setShown] = useState(0);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const ran = useRef(false);

  const refresh = useCallback(async () => setDisputes(await (await fetch("/api/agent")).json()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const run = useCallback(async (t = text, l = lang) => {
    setBusy(true); setResult(null); setShown(0);
    const r: AgentResult = await (await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t, lang: l }) })).json();
    setResult(r);
    for (let i = 1; i <= r.steps.length; i++) { await new Promise((ok) => setTimeout(ok, params.get("fast") ? 30 : 650)); setShown(i); }
    setBusy(false); refresh();
    if (!params.get("fast") && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(r.reply); u.lang = SAMPLES[l].bcp; speechSynthesis.speak(u);
    }
  }, [text, lang, params, refresh]);

  useEffect(() => {
    const l = params.get("lang") as Lang | null;
    if (l && SAMPLES[l]) { setLang(l); setText(SAMPLES[l].text); }
    if (params.get("autorun") && !ran.current) { ran.current = true; run(SAMPLES[l ?? "zu"].text, l ?? "zu"); }
  }, [params, run]);

  const mic = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setText(SAMPLES[lang].text); return; }
    const rec = new SR(); rec.lang = SAMPLES[lang].bcp; setListening(true);
    rec.onresult = (e: { results: { 0: { transcript: string } }[] }) => setText(e.results[0][0].transcript);
    rec.onend = () => setListening(false); rec.start();
  };

  const done = result && shown >= result.steps.length;
  const open = disputes.filter((d) => d.status !== "RESOLVED").length;
  const recovered = disputes.reduce((a, d) => a + d.amountDisputed, 0);

  return (
    <main className="grid-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 font-black text-black">U</div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Ubuntu Desk</h1>
              <p className="text-xs text-slate-400">“I am because we are” · multilingual municipal AI agent</p>
            </div>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="glass rounded-full px-3 py-1 text-emerald-300">● OpenEdge PASOE · mock</span>
            <span className="glass rounded-full px-3 py-1 text-indigo-300">● Progress Agentic RAG · mock</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Input */}
          <section className="glass rounded-2xl p-5 lg:col-span-4">
            <h2 className="mb-3 text-sm font-medium text-slate-300">Citizen message</h2>
            <div className="mb-4 flex gap-2">
              {(Object.keys(SAMPLES) as Lang[]).map((l) => (
                <button key={l} onClick={() => { setLang(l); setText(SAMPLES[l].text); }}
                  className={`rounded-lg px-3 py-1.5 text-xs transition ${lang === l ? "bg-emerald-400 text-black" : "glass text-slate-300 hover:bg-white/10"}`}>
                  {SAMPLES[l].label}
                </button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-emerald-400/60" />
            <div className="mt-4 flex items-center gap-3">
              <button onClick={mic} aria-label="Speak"
                className={`grid h-12 w-12 place-items-center rounded-full bg-emerald-400 text-xl text-black ${listening ? "pulsering" : ""}`}>🎙</button>
              <button onClick={() => run()} disabled={busy}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-indigo-500 py-3 text-sm font-semibold text-black disabled:opacity-50">
                {busy ? "Agent working…" : "Send to Ubuntu Desk"}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Account JHB-4471-0093 · voice uses browser speech APIs where available</p>

            {result && (
              <div className="mt-6 rise">
                <h3 className="mb-2 text-xs uppercase tracking-widest text-slate-500">OpenEdge account record</h3>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs">
                  <div className="mb-2 text-slate-400">{result.account.holder} · {result.account.ward} · {result.account.tariffCode}</div>
                  {result.account.readings.map((r) => (
                    <div key={r.period} className={`flex justify-between py-0.5 ${r.estimated ? "text-rose-300" : ""}`}>
                      <span>{r.period}</span><span>{r.kwh} kWh{r.estimated ? " (est.)" : ""}</span><span>R{r.billed.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Reasoning */}
          <section className="glass rounded-2xl p-5 lg:col-span-4">
            <h2 className="mb-3 text-sm font-medium text-slate-300">Agent reasoning</h2>
            {!result && !busy && <p className="text-sm text-slate-500">Send a message to watch the agent think, retrieve, verify and act.</p>}
            {busy && !result && <p className="animate-pulse text-sm text-emerald-300">Listening…</p>}
            <ol className="relative space-y-3 border-l border-white/10 pl-8 ml-3">
              {result?.steps.slice(0, shown).map((s, i) => (
                <li key={i} className="rise relative">
                  <span className="absolute -left-11 top-0 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-xs ring-1 ring-emerald-400/50">{ICON[s.kind]}</span>
                  <div className="text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-slate-400">{s.detail}</div>
                </li>
              ))}
            </ol>
            {done && (
              <div className="mt-5 rise rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                <div className="mb-1 text-xs uppercase tracking-widest text-emerald-300">Reply · {SAMPLES[result.lang].label} 🔊</div>
                <p className="text-sm leading-relaxed">{result.reply}</p>
              </div>
            )}
          </section>

          {/* Evidence */}
          <section className="space-y-6 lg:col-span-4">
            <div className="glass rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-medium text-slate-300">Cited evidence</h2>
              {done ? (
                <div className="rise space-y-3">
                  <div className="flex items-center gap-4">
                    <Gauge value={result.rag.remi.groundedness} />
                    <div className="space-y-1 text-xs text-slate-400">
                      <div>Groundedness <b className="text-emerald-300">{pct(result.rag.remi.groundedness)}</b></div>
                      <div>Answer relevance {pct(result.rag.remi.answerRelevance)}</div>
                      <div>Context relevance {pct(result.rag.remi.contextRelevance)}</div>
                      <div className="text-[10px] text-slate-500">REMi evaluation metrics</div>
                    </div>
                  </div>
                  {result.rag.citations.map((c) => (
                    <blockquote key={c.clause} className="rounded-xl border-l-2 border-indigo-400 bg-black/30 p-3 text-xs">
                      <div className="mb-1 font-semibold text-indigo-300">{c.clause} · p.{c.page}</div>
                      <div className="text-slate-300">“{c.text}”</div>
                      <div className="mt-1 text-[10px] text-slate-500">{c.docTitle}</div>
                    </blockquote>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">Citations appear here.</p>}
            </div>

            {done && result.finding.isError && (
              <div className="rise rounded-2xl border border-rose-400/40 bg-rose-500/10 p-5">
                <div className="text-xs uppercase tracking-widest text-rose-300">Billing error detected</div>
                <div className="mt-2 text-3xl font-bold">R{result.finding.overcharge.toFixed(2)} <span className="text-sm font-normal text-slate-400">overcharged</span></div>
                <p className="mt-1 text-xs text-slate-400">{result.finding.explanation}</p>
                {result.dispute && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 font-mono text-xs">
                    <span>{result.dispute.disputeId}</span><span className="text-amber-300">{result.dispute.status}</span><span>written to OpenEdge ✓</span>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Dashboard */}
        <section className="glass mt-6 rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Live operations dashboard</h2>
            <span className="text-[11px] text-emerald-300">● live</span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi label="Disputes logged" value={disputes.length} />
            <Kpi label="Open" value={open} />
            <Kpi label="Value under dispute" value={`R${recovered.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`} />
            <Kpi label="Languages served" value={new Set(disputes.map((d) => d.language)).size} />
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500"><tr><th className="py-2">ID</th><th>Account</th><th>Reason</th><th>Lang</th><th className="text-right">Amount</th><th className="text-right">Status</th></tr></thead>
            <tbody>
              {disputes.map((d, i) => (
                <tr key={d.disputeId} className={`border-t border-white/5 ${i === 0 && done ? "rise bg-emerald-400/10" : ""}`}>
                  <td className="py-2 font-mono">{d.disputeId}</td><td className="font-mono">{d.accountNo}</td><td>{d.reason}</td>
                  <td className="uppercase">{d.language}</td><td className="text-right">R{d.amountDisputed.toFixed(2)}</td>
                  <td className={`text-right ${d.status === "OPEN" ? "text-amber-300" : d.status === "RESOLVED" ? "text-emerald-300" : "text-indigo-300"}`}>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r={r} stroke="rgba(255,255,255,.1)" strokeWidth="7" fill="none" />
      <circle cx="38" cy="38" r={r} stroke="url(#g)" strokeWidth="7" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform="rotate(-90 38 38)" />
      <defs><linearGradient id="g"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#818cf8" /></linearGradient></defs>
      <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e6edf7">{pct(value)}</text>
    </svg>
  );
}

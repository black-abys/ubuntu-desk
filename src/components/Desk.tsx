"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BillPanel from "@/components/BillPanel";
import Lifecycle from "@/components/Lifecycle";
import ScanWorkspace, { type ScanPayload } from "@/components/ScanWorkspace";
import Timeline from "@/components/Timeline";
import { DEMO_ACCOUNT_NO } from "@/lib/demo";
import { isLang, languageByCode, LANGUAGES } from "@/lib/languages";
import { FINDING_TITLE, NEXT_STATUS, STATUS_LABEL } from "@/lib/labels";
import type { AgentResult, BackendMode, BillAnalysis, BillContext, Citation, Dispute, DisputeDraft, Lang, RagAnswer, VaultDocument } from "@/lib/types";

type Workspace = "resident" | "scan" | "dashboard";

const EMPTY_MODE: BackendMode = { openedge: "simulated", rag: "simulated", ocr: "simulated", documents: "simulated" };

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || `Request failed (${response.status})`;
}

function pill(flag: BackendMode["openedge"], simulated: string, real: string) {
  return flag === "simulated" ? simulated : real;
}

export default function Desk() {
  const params = useSearchParams();
  const [workspace, setWorkspace] = useState<Workspace>("resident");
  const [lang, setLang] = useState<Lang>("zu");
  const [accountNo, setAccountNo] = useState(DEMO_ACCOUNT_NO);
  const [text, setText] = useState(languageByCode("zu").sample);
  const [listening, setListening] = useState(false);
  const [sttConfidence, setSttConfidence] = useState<number | null>(null);
  const [sttNote, setSttNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [shown, setShown] = useState(0);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [remi, setRemi] = useState<RagAnswer["remi"] | null>(null);
  const [ack, setAck] = useState(false);
  const [ackNote, setAckNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<BackendMode>(EMPTY_MODE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const billRef = useRef<BillContext | null>(null);
  const ran = useRef(false);
  const urlApplied = useRef(false);

  const refreshDisputes = useCallback(async () => {
    const response = await fetch("/api/disputes");
    if (response.ok) setDisputes(await response.json());
  }, []);

  const refreshDocuments = useCallback(async () => {
    const response = await fetch("/api/documents");
    if (response.ok) setDocuments(await response.json());
  }, []);

  useEffect(() => {
    void refreshDisputes();
    void refreshDocuments();
    void fetch("/api/status").then(async (response) => {
      if (response.ok) setMode(await response.json());
    });
  }, [refreshDisputes, refreshDocuments]);

  const submitDraft = useCallback(async (draft: DisputeDraft, viaAutorun = false) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, confirmed: true, documentId: draft.documentId ?? billRef.current?.documentId ?? null }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const dispute = (await response.json()) as Dispute;
      setResult((current) => (current ? { ...current, dispute, draft } : current));
      setSelectedId(dispute.disputeId);
      if (viaAutorun) setAckNote("Demo autorun confirmed this submission.");
      await refreshDisputes();
      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the dispute");
    } finally {
      setSubmitting(false);
    }
  }, [refreshDisputes, refreshDocuments]);

  const run = useCallback(async (message = text, chosen = lang, opts?: { confirm?: boolean }) => {
    setBusy(true);
    setResult(null);
    setShown(0);
    setAck(Boolean(opts?.confirm));
    setAckNote(opts?.confirm ? "Demo autorun will confirm this submission." : null);
    setError(null);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message,
          lang: chosen,
          accountNo: accountNo.trim() || DEMO_ACCOUNT_NO,
          bill: billRef.current,
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const agentResult = (await response.json()) as AgentResult;
      setResult(agentResult);
      setAnalysis(agentResult.analysis);
      setCitations(agentResult.rag.citations);
      setRemi(agentResult.rag.remi);
      const delay = params.get("fast") ? 30 : 650;
      for (let i = 1; i <= agentResult.steps.length; i++) {
        await new Promise((ok) => setTimeout(ok, delay));
        setShown(i);
      }
      if (opts?.confirm && agentResult.draft) await submitDraft(agentResult.draft, true);
      const fast = params.get("fast");
      if (!fast && agentResult.replyMode === "demo-script" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(agentResult.reply);
        utterance.lang = languageByCode(chosen).bcp;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The demo agent could not run");
    } finally {
      setBusy(false);
    }
  }, [text, lang, accountNo, params, submitDraft]);

  useEffect(() => {
    if (urlApplied.current) return;
    urlApplied.current = true;
    const requested = params.get("lang");
    const chosen = isLang(requested) ? requested : "zu";
    if (isLang(requested)) {
      setLang(chosen);
      const info = languageByCode(chosen);
      setText(info.support === "full" ? info.sample : "");
    }
    const requestedWorkspace = params.get("workspace");
    if (requestedWorkspace === "scan" || requestedWorkspace === "dashboard" || requestedWorkspace === "resident") {
      setWorkspace(requestedWorkspace);
    }
    if (params.get("autorun") && !ran.current) {
      ran.current = true;
      const info = languageByCode(chosen);
      const message = info.support === "full" ? info.sample : "Why is my electricity bill so high this month?";
      void run(message, info.code, { confirm: params.get("confirm") === "1" });
    }
  }, [params, run]);

  function chooseLanguage(next: Lang) {
    const info = languageByCode(next);
    setLang(next);
    setText(info.support === "full" ? info.sample : "");
    setSttConfidence(null);
    setSttNote(null);
  }

  function mic() {
    setSttConfidence(null);
    setSttNote(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Speech) {
      setSttNote("This browser has no speech recognition. Type the message instead. Speech confidence is separate from retrieval groundedness.");
      return;
    }
    const recognition = new Speech();
    recognition.lang = languageByCode(lang).bcp;
    setListening(true);
    recognition.onresult = (event: { results: { 0: { transcript: string; confidence: number } }[] }) => {
      const heard = event.results[0][0];
      setText(heard.transcript);
      if (typeof heard.confidence === "number" && heard.confidence > 0) setSttConfidence(heard.confidence);
      else setSttNote("The browser did not report a speech-recognition confidence score.");
    };
    recognition.onerror = () => setSttNote("Speech recognition stopped. You can still type.");
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function onSaved(payload: ScanPayload) {
    setDocuments((current) => [payload.document, ...current.filter((doc) => doc.documentId !== payload.document.documentId)]);
    if (payload.accountError) {
      setAnalysis(null);
      setCitations([]);
      setRemi(null);
      billRef.current = null;
      setError(payload.accountError);
      return;
    }
    setError(null);
    if (payload.analysis) {
      setAnalysis(payload.analysis);
      setCitations(payload.citations ?? []);
      setRemi(payload.remi);
      const extraction = payload.document.extraction;
      billRef.current = extraction
        ? {
            accountNo: extraction.accountNo,
            holder: extraction.holder,
            period: extraction.period,
            kwh: extraction.kwh,
            total: extraction.total,
            estimated: extraction.estimated,
            simulated: true,
            documentId: payload.document.documentId,
          }
        : null;
    }
  }

  function onLinked(document: VaultDocument) {
    setDocuments((current) => current.map((item) => (item.documentId === document.documentId ? document : item)));
    void refreshDisputes();
  }

  async function advance(dispute: Dispute) {
    const next = NEXT_STATUS[dispute.status];
    if (!next) return;
    setError(null);
    const response = await fetch("/api/disputes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disputeId: dispute.disputeId, status: next }),
    });
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    await refreshDisputes();
  }

  const info = languageByCode(lang);
  const done = Boolean(result && shown >= result.steps.length);
  const draft = done ? result?.draft ?? null : null;
  const open = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const value = disputes.reduce((sum, dispute) => sum + dispute.amountDisputed, 0);
  const selected = disputes.find((dispute) => dispute.disputeId === selectedId) ?? disputes[0];

  return (
    <main className="grid-bg min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 font-black text-black">U</div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Ubuntu Desk</h1>
              <p className="text-xs text-slate-400">“I am because we are” · municipal services demo</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="glass rounded-full px-3 py-1 text-emerald-300">{pill(mode.openedge, "OpenEdge · simulated", "OpenEdge · real adapter, unverified")}</span>
            <span className="glass rounded-full px-3 py-1 text-indigo-300">{pill(mode.rag, "Agentic RAG · simulated", "Agentic RAG · real adapter, unverified")}</span>
            <span className="glass rounded-full px-3 py-1 text-amber-200">{pill(mode.ocr, "OCR · simulated", "OCR · real adapter, unverified")}</span>
          </div>
        </header>

        <div className="mb-4 rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm leading-relaxed text-amber-50">
          <strong className="font-semibold">Demo · simulated data.</strong> Account lookup, rule-based reasoning, policy answers, and OCR are simulated. Ubuntu Desk is not connected to a live municipality.
        </div>

        <nav aria-label="Workspaces" className="mb-4 flex gap-2 overflow-x-auto pb-1 sm:mb-6">
          {([
            ["resident", "Resident"],
            ["scan", "Scan & Documents"],
            ["dashboard", "Municipal dashboard"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={workspace === id ? "page" : undefined}
              onClick={() => setWorkspace(id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${workspace === id ? "bg-emerald-400 font-semibold text-black" : "glass text-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {error && <p className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100" role="alert">{error}</p>}

        {workspace === "resident" && (
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <section className="glass min-w-0 rounded-2xl p-4 sm:p-5 lg:col-span-4">
              <h2 className="mb-3 text-sm font-medium text-slate-300">Resident message</h2>
              <fieldset className="mb-4">
                <legend className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">Official languages</legend>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => chooseLanguage(item.code)}
                      aria-pressed={lang === item.code}
                      className={`rounded-lg px-2.5 py-1.5 text-xs ${lang === item.code ? "bg-emerald-400 font-semibold text-black" : "glass text-slate-300"}`}
                    >
                      {item.label}
                      {item.support === "stub" && <span className="ml-1 text-[10px] opacity-70">Soon</span>}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="mb-3 block text-[11px] uppercase tracking-widest text-slate-500">
                Account number
                <input
                  value={accountNo}
                  onChange={(event) => setAccountNo(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="account-hint"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm normal-case tracking-normal text-slate-100 outline-none focus:border-emerald-400/60"
                />
              </label>
              {info.support === "stub" && (
                <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-50">
                  Coming soon for {info.label}. You can select it and type, but this demo will not invent a fluent {info.label} reply. The browser may still transcribe speech. Any confidence it reports is only about the transcript.
                </p>
              )}
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                placeholder={info.support === "stub" ? `Coming soon for ${info.label}. A reviewed reply is not available yet.` : "Type a message"}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-emerald-400/60"
              />
              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={mic} aria-label="Speak" className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-400 text-xl text-black ${listening ? "pulsering" : ""}`}>🎙</button>
                <button type="button" onClick={() => void run()} disabled={busy} className="min-w-0 flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-indigo-500 px-3 py-3 text-sm font-semibold text-black disabled:opacity-50">
                  {busy ? "Agent working…" : "Send to Ubuntu Desk"}
                </button>
              </div>
              <p id="account-hint" className="mt-3 text-[11px] leading-relaxed text-slate-500">
                Demo account {DEMO_ACCOUNT_NO}. Any other number is reported as not found. English, isiZulu, and Sesotho use reviewed demo scripts and browser speech where the device allows. Speech confidence is not a groundedness score.
              </p>
              {sttConfidence != null && (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Speech-recognition confidence: {Math.round(sttConfidence * 100)}%. This is the browser transcript score, not retrieval groundedness and not a trust score.
                </p>
              )}
              {sttNote && <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{sttNote}</p>}
              {result?.account && (
                <div className="mt-6">
                  <h3 className="mb-2 text-xs uppercase tracking-widest text-slate-500">Simulated account record</h3>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs">
                    <div className="mb-2 text-slate-400">{result.account.holder} · {result.account.ward} · {result.account.tariffCode}</div>
                    {result.account.readings.map((reading) => (
                      <div key={reading.period} className={`flex justify-between gap-2 py-0.5 ${reading.estimated ? "text-rose-300" : ""}`}>
                        <span>{reading.period}</span>
                        <span className="text-right">{reading.kwh} kWh{reading.estimated ? " (est.)" : ""}</span>
                        <span>R{reading.billed.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="glass min-w-0 rounded-2xl p-4 sm:p-5 lg:col-span-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-slate-300">Agent reasoning</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">Rule-based demo</span>
              </div>
              {!result && !busy && <p className="text-sm text-slate-500">Send a message to watch the simulated lookup, the cited cap, and the draft dispute.</p>}
              {busy && !result && <p className="animate-pulse text-sm text-emerald-300">Working on simulated records…</p>}
              {result && <Timeline steps={result.steps.slice(0, shown)} />}
              {done && result && (
                <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                  <div className="mb-1 text-xs uppercase tracking-widest text-emerald-300">
                    {result.replyMode === "coming-soon" ? `Coming soon · ${languageByCode(result.lang).label}` : `Demo reply · ${languageByCode(result.lang).label}`}
                  </div>
                  <p className="text-sm leading-relaxed">{result.reply}</p>
                  {result.replyMode === "demo-script" && result.lang !== "en" && (
                    <p className="mt-2 text-[11px] leading-relaxed text-emerald-100/80">
                      Demo script for the voice reply. It is not a certified translation. Playback uses the browser voice for this language when one is installed, and that is separate from the retrieval score.
                    </p>
                  )}
                </div>
              )}
              {done && draft && !result?.dispute && (
                <form
                  className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (ack) void submitDraft(draft);
                  }}
                >
                  <h3 className="text-sm font-medium">Dispute draft</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">Nothing is written until you confirm. Submitting stores the case in the demo adapter, not in a live municipal system.</p>
                  <div className="mt-3">
                    <Lifecycle status="draft" />
                  </div>
                  <p className="mt-3 text-xs text-slate-300">{draft.reason}</p>
                  <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-200">
                    <input type="checkbox" className="mt-0.5" checked={ack} onChange={(event) => setAck(event.target.checked)} />
                    I confirm Ubuntu Desk may submit this dispute using the simulated demo records.
                  </label>
                  {ackNote && <p className="mt-2 text-[11px] text-amber-200">{ackNote}</p>}
                  {error && <p className="mt-2 text-xs leading-relaxed text-rose-200">{error}</p>}
                  <button type="submit" disabled={!ack || submitting} className="mt-3 w-full rounded-xl bg-emerald-400 py-2 text-sm font-semibold text-black disabled:opacity-50">
                    {submitting ? "Submitting…" : "Submit dispute"}
                  </button>
                </form>
              )}
              {done && result?.dispute && (
                <div className="mt-4 space-y-3 rounded-xl border border-emerald-400/30 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-widest text-emerald-300">Case {result.dispute.disputeId}{result.dispute.simulated ? " · simulated" : ""}</div>
                  <Lifecycle status={result.dispute.status} />
                  <p className="text-[11px] text-slate-500">Stored on the simulated OpenEdge adapter. Collection has not been suspended.</p>
                  <button type="button" onClick={() => setWorkspace("dashboard")} className="text-xs text-emerald-300 underline-offset-2 hover:underline">Open the municipal dashboard</button>
                </div>
              )}
            </section>

            <section className="min-w-0 space-y-4 lg:col-span-4">
              <div className="glass rounded-2xl p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-medium text-slate-300">Bill analysis</h2>
                  <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-[11px] text-amber-200">
                    {analysis?.usedBill ? "Uses scanned bill · simulated" : "Simulated account only"}
                  </span>
                </div>
                <BillPanel analysis={done || analysis?.usedBill ? analysis : null} citations={done || analysis?.usedBill ? citations : []} remi={done ? remi : analysis?.usedBill ? remi : null} simulatedRag={mode.rag === "simulated"} />
              </div>
            </section>
          </div>
        )}

        {workspace === "scan" && (
          <div className="space-y-4">
            <ScanWorkspace
              documents={documents}
              disputes={disputes}
              loadSample={params.get("sample") === "1"}
              onSaved={onSaved}
              onLinked={onLinked}
            />
            {analysis?.usedBill && (
              <section className="glass rounded-2xl p-4 sm:p-5">
                <h2 className="mb-3 text-sm font-medium text-slate-300">Bill analysis</h2>
                <BillPanel analysis={analysis} citations={citations} remi={remi} simulatedRag={mode.rag === "simulated"} />
              </section>
            )}
          </div>
        )}

        {workspace === "dashboard" && (
          <section className="glass rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-300">Municipal dashboard</h2>
              <span className="text-[11px] text-amber-200">Simulated cases · not a live queue</span>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label="Cases in the demo" value={disputes.length} />
              <Kpi label="Not resolved" value={open} />
              <Kpi label="Value on demo cases" value={`R${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
              <Kpi label="Languages on cases" value={new Set(disputes.map((dispute) => dispute.language)).size} />
            </div>
            <div className="space-y-3 md:hidden">
              {disputes.map((dispute) => (
                <button key={dispute.disputeId} type="button" onClick={() => setSelectedId(dispute.disputeId)} className={`w-full rounded-xl border p-3 text-left ${selected?.disputeId === dispute.disputeId ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10"}`}>
                  <div className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span>{dispute.disputeId}</span>
                    <span className={statusClass(dispute.status)}>{STATUS_LABEL[dispute.status]}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">{dispute.reason}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{dispute.accountNo} · {dispute.language.toUpperCase()} · R{dispute.amountDisputed.toFixed(2)}</p>
                </button>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2 font-medium">ID</th>
                    <th className="font-medium">Account</th>
                    <th className="font-medium">Reason</th>
                    <th className="font-medium">Lang</th>
                    <th className="text-right font-medium">Amount</th>
                    <th className="text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.disputeId} onClick={() => setSelectedId(dispute.disputeId)} className={`cursor-pointer border-t border-white/5 ${selected?.disputeId === dispute.disputeId ? "bg-emerald-400/10" : ""}`}>
                      <td className="py-2 font-mono">{dispute.disputeId}</td>
                      <td className="font-mono">{dispute.accountNo}</td>
                      <td className="max-w-xs pr-3">{dispute.reason}</td>
                      <td className="uppercase">{dispute.language}</td>
                      <td className="text-right">R{dispute.amountDisputed.toFixed(2)}</td>
                      <td className={`text-right ${statusClass(dispute.status)}`}>{STATUS_LABEL[dispute.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected && (
              <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-widest text-slate-500">{selected.disputeId}</div>
                <Lifecycle status={selected.status} />
                <p className="text-xs text-slate-400">{selected.reason}{selected.documentId ? ` · document ${selected.documentId}` : ""}</p>
                {NEXT_STATUS[selected.status] && (
                  <button type="button" onClick={() => void advance(selected)} className="rounded-xl border border-white/15 px-3 py-2 text-xs">
                    Mark {STATUS_LABEL[NEXT_STATUS[selected.status]!]} (simulated staff action)
                  </button>
                )}
              </div>
            )}
            {analysis && (
              <p className="mt-4 text-[11px] text-slate-500">
                Latest finding: {FINDING_TITLE[analysis.finding]}. Staff actions here only move the demo lifecycle.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 sm:p-4">
      <div className="text-xl font-semibold sm:text-2xl">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function statusClass(status: Dispute["status"]) {
  if (status === "resolved") return "text-emerald-300";
  if (status === "under_review") return "text-indigo-300";
  if (status === "submitted") return "text-amber-300";
  return "text-slate-400";
}

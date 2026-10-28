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
    <div className="min-h-screen overflow-x-hidden bg-canvas text-ink">
      <header className="nav-bar">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <div className="text-[17px] font-semibold tracking-tight">Ubuntu Desk</div>
          <nav aria-label="Workspaces" className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
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
                className="chip"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="page-main mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-6 max-w-2xl sm:mb-8">
          <h1 className="text-[2.15rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">Ubuntu Desk</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-muted">“I am because we are.” A municipal services demo.</p>
        </div>

        <div className="notice mb-4 px-4 py-3.5 text-[15px] leading-relaxed" role="note">
          <strong className="font-semibold">Demo · simulated data.</strong> Account lookup, rule-based reasoning, policy answers, and OCR are simulated. Ubuntu Desk is not connected to a live municipality.
        </div>

        <div className="mb-8 flex flex-wrap gap-2 sm:mb-10">
          <span className="honesty">{pill(mode.openedge, "OpenEdge · simulated", "OpenEdge · real adapter, unverified")}</span>
          <span className="honesty">{pill(mode.rag, "Agentic RAG · simulated", "Agentic RAG · real adapter, unverified")}</span>
          <span className="honesty">{pill(mode.ocr, "OCR · simulated", "OCR · real adapter, unverified")}</span>
        </div>

        {error && <p className="alert mb-6 px-4 py-3 text-[15px] leading-relaxed" role="alert">{error}</p>}

        {workspace === "resident" && (
          <div className="grid items-start gap-5 lg:grid-cols-12 lg:gap-6">
            <section className="card min-w-0 p-5 sm:p-6 lg:col-span-4">
              <h2 className="section-title mb-4">Resident message</h2>
              <div className="mb-4">
                <label htmlFor="language" className="block text-[13px] font-semibold text-muted">
                  Language
                </label>
                <select
                  id="language"
                  value={lang}
                  onChange={(event) => {
                    if (isLang(event.target.value)) chooseLanguage(event.target.value);
                  }}
                  className="field select mt-1.5"
                  aria-describedby={info.support === "stub" ? "lang-note" : undefined}
                >
                  <optgroup label="Full support">
                    {LANGUAGES.filter((item) => item.support === "full").map((item) => (
                      <option key={item.code} value={item.code}>{item.native}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Preview">
                    {LANGUAGES.filter((item) => item.support === "stub").map((item) => (
                      <option key={item.code} value={item.code}>{item.native}</option>
                    ))}
                  </optgroup>
                </select>
                {info.support === "stub" && (
                  <p id="lang-note" className="quiet mt-2">
                    Replies in English for now. Full {info.native} support is coming.
                  </p>
                )}
              </div>
              <label className="mb-4 block text-[13px] font-semibold text-muted">
                Account number
                <input
                  value={accountNo}
                  onChange={(event) => setAccountNo(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="account-hint"
                  className="field mt-1.5 font-mono tracking-normal"
                />
              </label>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                placeholder={info.support === "stub" ? `Coming soon for ${info.label}. A reviewed reply is not available yet.` : "Type a message"}
                className="field resize-none"
              />
              <div className="composer-actions mt-4 flex items-center gap-3">
                <button type="button" onClick={mic} aria-label="Speak" className={`icon-btn ${listening ? "pulsering" : ""}`}>
                  <SpeakIcon />
                </button>
                <button type="button" onClick={() => void run()} disabled={busy} className="btn-primary min-w-0 flex-1">
                  {busy ? "Agent working…" : "Send to Ubuntu Desk"}
                </button>
              </div>
              <p id="account-hint" className="quiet mt-4">
                Demo account {DEMO_ACCOUNT_NO}. Any other number is reported as not found. English, isiZulu, and Sesotho use reviewed demo scripts and browser speech where the device allows. Speech confidence is not a groundedness score.
              </p>
              {sttConfidence != null && (
                <p className="quiet mt-2">
                  Speech-recognition confidence: {Math.round(sttConfidence * 100)}%. This is the browser transcript score, not retrieval groundedness and not a trust score.
                </p>
              )}
              {sttNote && <p className="quiet mt-2">{sttNote}</p>}
              {result?.account && (
                <div className="mt-6">
                  <h3 className="mb-2 text-[13px] font-semibold text-muted">Simulated account record</h3>
                  <div className="nums inset p-3.5 font-mono text-[13px] leading-relaxed">
                    <div className="mb-2 text-muted">{result.account.holder} · {result.account.ward} · {result.account.tariffCode}</div>
                    {result.account.readings.map((reading) => (
                      <div key={reading.period} className={`flex justify-between gap-2 py-0.5 ${reading.estimated ? "est" : ""}`}>
                        <span>{reading.period}</span>
                        <span className="text-right">{reading.kwh} kWh{reading.estimated ? " (est.)" : ""}</span>
                        <span>R{reading.billed.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="card min-w-0 p-5 sm:p-6 lg:col-span-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-title">Agent reasoning</h2>
                <span className="honesty">Rule-based demo</span>
              </div>
              {!result && !busy && <p className="text-[15px] leading-relaxed text-muted">Send a message to watch the simulated lookup, the cited cap, and the draft dispute.</p>}
              {busy && !result && <p className="animate-pulse text-[15px] text-muted">Working on simulated records…</p>}
              {result && <Timeline steps={result.steps.slice(0, shown)} />}
              {done && result && (
                <div className="inset mt-5 p-4">
                  <div className="mb-2">
                    <span className="honesty">
                      {result.replyMode === "coming-soon" ? `Coming soon · ${languageByCode(result.lang).label}` : `Demo reply · ${languageByCode(result.lang).label}`}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed">{result.reply}</p>
                  {result.replyMode === "demo-script" && result.lang !== "en" && (
                    <p className="quiet mt-3">
                      Demo script for the voice reply. It is not a certified translation. Playback uses the browser voice for this language when one is installed, and that is separate from the retrieval score.
                    </p>
                  )}
                </div>
              )}
              {done && draft && !result?.dispute && (
                <form
                  className="inset mt-4 p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (ack) void submitDraft(draft);
                  }}
                >
                  <h3 className="text-[15px] font-semibold">Dispute draft</h3>
                  <p className="quiet mt-1">Nothing is written until you confirm. Submitting stores the case in the demo adapter, not in a live municipal system.</p>
                  <div className="mt-3">
                    <Lifecycle status="draft" />
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed">{draft.reason}</p>
                  <label className="mt-3 flex items-start gap-2.5 text-[14px] leading-relaxed">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#0066cc]" checked={ack} onChange={(event) => setAck(event.target.checked)} />
                    I confirm Ubuntu Desk may submit this dispute using the simulated demo records.
                  </label>
                  {ackNote && <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#6b4e16]">{ackNote}</p>}
                  {error && <p className="alert mt-3 px-3 py-2 text-[13px] leading-relaxed">{error}</p>}
                  <button type="submit" disabled={!ack || submitting} className="btn-primary mt-4 w-full">
                    {submitting ? "Submitting…" : "Submit dispute"}
                  </button>
                </form>
              )}
              {done && result?.dispute && (
                <div className="inset mt-4 space-y-3 p-4">
                  <div className="text-[13px] font-semibold tracking-wide text-accent">Case {result.dispute.disputeId}{result.dispute.simulated ? " · simulated" : ""}</div>
                  <Lifecycle status={result.dispute.status} />
                  <p className="quiet">Stored on the simulated OpenEdge adapter. Collection has not been suspended.</p>
                  <button type="button" onClick={() => setWorkspace("dashboard")} className="link">Open the municipal dashboard</button>
                </div>
              )}
            </section>

            <section className="min-w-0 space-y-4 lg:col-span-4">
              <div className="card p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="section-title">Bill analysis</h2>
                  <span className="honesty">
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
              <section className="card p-5 sm:p-6">
                <h2 className="section-title mb-4">Bill analysis</h2>
                <BillPanel analysis={analysis} citations={citations} remi={remi} simulatedRag={mode.rag === "simulated"} />
              </section>
            )}
          </div>
        )}

        {workspace === "dashboard" && (
          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title">Municipal dashboard</h2>
              <span className="honesty">Simulated cases · not a live queue</span>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label="Cases in the demo" value={disputes.length} />
              <Kpi label="Not resolved" value={open} />
              <Kpi label="Value on demo cases" value={`R${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
              <Kpi label="Languages on cases" value={new Set(disputes.map((dispute) => dispute.language)).size} />
            </div>
            <div className="space-y-3 md:hidden">
              {disputes.map((dispute) => (
                <button key={dispute.disputeId} type="button" onClick={() => setSelectedId(dispute.disputeId)} className={`w-full rounded-2xl border p-4 text-left ${selected?.disputeId === dispute.disputeId ? "border-ink bg-paper" : "border-black/10 bg-white"}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="nums whitespace-nowrap font-mono text-[13px]">{dispute.disputeId}</span>
                    <span className={`text-[13px] leading-snug ${statusClass(dispute.status)}`}>{STATUS_LABEL[dispute.status]}</span>
                  </div>
                  <p className="mt-2 text-[14px] leading-snug">{dispute.reason}</p>
                  <p className="quiet mt-1">{dispute.accountNo} · {dispute.language.toUpperCase()} · R{dispute.amountDisputed.toFixed(2)}</p>
                </button>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Account</th>
                    <th>Reason</th>
                    <th>Lang</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.disputeId} onClick={() => setSelectedId(dispute.disputeId)} className={selected?.disputeId === dispute.disputeId ? "is-selected" : ""}>
                      <td className="nums font-mono">{dispute.disputeId}</td>
                      <td className="nums font-mono">{dispute.accountNo}</td>
                      <td className="max-w-xs pr-3">{dispute.reason}</td>
                      <td className="uppercase">{dispute.language}</td>
                      <td className="nums text-right">R{dispute.amountDisputed.toFixed(2)}</td>
                      <td className={`text-right ${statusClass(dispute.status)}`}>{STATUS_LABEL[dispute.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected && (
              <div className="inset mt-5 space-y-3 p-4">
                <div className="text-[13px] font-semibold tracking-wide text-muted">{selected.disputeId}</div>
                <Lifecycle status={selected.status} />
                <p className="quiet">{selected.reason}{selected.documentId ? ` · document ${selected.documentId}` : ""}</p>
                {NEXT_STATUS[selected.status] && (
                  <button type="button" onClick={() => void advance(selected)} className="btn-secondary max-w-full text-balance">
                    Mark {STATUS_LABEL[NEXT_STATUS[selected.status]!]} (simulated staff action)
                  </button>
                )}
              </div>
            )}
            {analysis && (
              <p className="quiet mt-4">
                Latest finding: {FINDING_TITLE[analysis.finding]}. Staff actions here only move the demo lifecycle.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function SpeakIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="inset p-4">
      <div className="nums text-[1.75rem] font-semibold leading-none tracking-tight sm:text-3xl">{value}</div>
      <div className="quiet mt-2">{label}</div>
    </div>
  );
}

function statusClass(status: Dispute["status"]) {
  if (status === "resolved") return "status-resolved";
  if (status === "under_review") return "status-review";
  if (status === "submitted") return "status-submitted";
  return "status-draft";
}

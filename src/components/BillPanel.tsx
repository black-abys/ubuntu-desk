"use client";
import { useId } from "react";
import { formatRand } from "@/lib/billing";
import { FINDING_TITLE } from "@/lib/labels";
import type { BillAnalysis, Citation, RagAnswer } from "@/lib/types";

const pct = (value: number) => `${Math.round(value * 100)}%`;

export default function BillPanel({
  analysis,
  citations,
  remi,
  simulatedRag = true,
}: {
  analysis: BillAnalysis | null;
  citations: Citation[];
  remi?: RagAnswer["remi"] | null;
  simulatedRag?: boolean;
}) {
  if (!analysis) {
    return <p className="text-sm text-slate-500">Scan a bill, or send a message, to see the calculation.</p>;
  }

  const tone =
    analysis.finding === "potential billing error"
      ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
      : analysis.finding === "needs reconciliation"
        ? "border-indigo-300/40 bg-indigo-300/10 text-indigo-100"
        : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${tone}`}>
        <div className="text-xs uppercase tracking-widest">{FINDING_TITLE[analysis.finding]}</div>
        {analysis.isPotentialError && (
          <div className="mt-2 text-3xl font-bold text-white">
            {formatRand(analysis.overcharge)}{" "}
            <span className="text-sm font-normal text-slate-300">difference on the demo figures</span>
          </div>
        )}
        <p className="mt-2 text-xs leading-relaxed text-slate-200">{analysis.caution}</p>
      </div>

      <div>
        <h3 className="mb-2 text-xs uppercase tracking-widest text-slate-500">Calculation steps</h3>
        <ol className="space-y-2">
          {analysis.steps.map((step, index) => (
            <li key={step.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-xs font-medium text-slate-200">
                  {index + 1}. {step.label}
                </div>
                {step.cite && <div className="shrink-0 text-[10px] text-indigo-300">{step.cite}</div>}
              </div>
              <p className="mt-1 text-sm text-slate-100">{step.detail}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{step.source}</p>
            </li>
          ))}
        </ol>
      </div>

      {remi && (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center">
          <Gauge value={remi.groundedness} />
          <div className="space-y-1 text-xs text-slate-400">
            <div>
              Retrieval groundedness <b className="text-emerald-300">{pct(remi.groundedness)}</b>
            </div>
            <div>Answer relevance {pct(remi.answerRelevance)}</div>
            <div>Context relevance {pct(remi.contextRelevance)}</div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              {simulatedRag ? "Demo retrieval scores, not a live REMi call. " : ""}
              Groundedness is about the cited answer. It is separate from speech-recognition confidence, and it is not proof that a translation or legal reading is correct.
            </p>
          </div>
        </div>
      )}

      {citations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-slate-500">Cited clauses</h3>
          {citations.map((citation) => (
            <blockquote key={citation.clause} className="rounded-xl border-l-2 border-indigo-400 bg-black/30 p-3 text-xs">
              <div className="mb-1 font-semibold text-indigo-300">
                {citation.clause}
                {citation.page ? ` · p.${citation.page}` : ""}
              </div>
              <p className="text-slate-300">“{citation.text}”</p>
              <div className="mt-1 text-[10px] text-slate-500">{citation.docTitle} · demo knowledge fixture</div>
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const gradientId = `groundedness-${useId().replace(/:/g, "")}`;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Retrieval groundedness ${pct(value)}`}>
      <circle cx="38" cy="38" r={radius} stroke="rgba(255,255,255,.1)" strokeWidth="7" fill="none" />
      <circle
        cx="38"
        cy="38"
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value)}
        transform="rotate(-90 38 38)"
      />
      <defs>
        <linearGradient id={gradientId}>
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e6edf7">
        {pct(value)}
      </text>
    </svg>
  );
}

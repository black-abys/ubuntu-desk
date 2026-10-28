"use client";
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
    return <p className="text-[15px] leading-relaxed text-muted">Scan a bill, or send a message, to see the calculation.</p>;
  }

  const tone = analysis.finding === "potential billing error" ? "notice p-5" : "inset p-5";

  return (
    <div className="space-y-5">
      <div className={tone}>
        <div className="text-[13px] font-semibold text-[#6b4e16]">{FINDING_TITLE[analysis.finding]}</div>
        {analysis.isPotentialError && (
          <div className="nums mt-3 text-[2.5rem] font-semibold leading-none tracking-tight text-ink">
            {formatRand(analysis.overcharge)}
            <span className="mt-2 block text-[15px] font-normal leading-snug text-muted">difference on the demo figures</span>
          </div>
        )}
        <p className="mt-3 text-[14px] leading-relaxed text-ink">{analysis.caution}</p>
      </div>

      <div>
        <h3 className="mb-3 text-[15px] font-semibold tracking-tight">Calculation steps</h3>
        <ol className="space-y-3">
          {analysis.steps.map((step, index) => (
            <li key={step.id} className="inset p-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[14px] font-medium text-ink">
                  {index + 1}. {step.label}
                </div>
                {step.cite && <div className="shrink-0 text-[13px] font-medium text-accent">{step.cite}</div>}
              </div>
              <p className="mt-1 text-[15px] leading-snug text-ink">{step.detail}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{step.source}</p>
            </li>
          ))}
        </ol>
      </div>

      {remi && (
        <div className="inset flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center">
          <Gauge value={remi.groundedness} />
          <div className="space-y-1 text-[13px] leading-relaxed text-muted">
            <div>
              Retrieval groundedness <b className="font-semibold text-accent">{pct(remi.groundedness)}</b>
            </div>
            <div>Answer relevance {pct(remi.answerRelevance)}</div>
            <div>Context relevance {pct(remi.contextRelevance)}</div>
            <p className="pt-1 text-[13px] leading-relaxed">
              {simulatedRag ? "Demo retrieval scores, not a live REMi call. " : ""}
              Groundedness is about the cited answer. It is separate from speech-recognition confidence, and it is not proof that a translation or legal reading is correct.
            </p>
          </div>
        </div>
      )}

      {citations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[15px] font-semibold tracking-tight">Cited clauses</h3>
          {citations.map((citation) => (
            <blockquote key={citation.clause} className="rounded-2xl border border-black/10 border-l-[3px] border-l-accent bg-paper p-4 text-[14px]">
              <div className="mb-1 font-semibold text-accent">
                {citation.clause}
                {citation.page ? ` · p.${citation.page}` : ""}
              </div>
              <p className="leading-relaxed text-ink">“{citation.text}”</p>
              <div className="mt-2 text-[13px] text-muted">{citation.docTitle} · demo knowledge fixture</div>
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
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Retrieval groundedness ${pct(value)}`} className="shrink-0">
      <circle cx="38" cy="38" r={radius} stroke="#e8e8ed" strokeWidth="7" fill="none" />
      <circle
        cx="38"
        cy="38"
        r={radius}
        stroke="#0066cc"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value)}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" fontSize="14" fontWeight="650" fill="#1d1d1f">
        {pct(value)}
      </text>
    </svg>
  );
}

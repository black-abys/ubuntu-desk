import type { ReactNode } from "react";
import type { AgentStep } from "@/lib/types";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICON: Record<AgentStep["kind"], ReactNode> = {
  listen: (
    <Glyph>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v3" />
    </Glyph>
  ),
  translate: (
    <Glyph>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.7 3.6 5.7 3.6 9s-1.2 6.3-3.6 9c-2.4-2.7-3.6-5.7-3.6-9s1.2-6.3 3.6-9z" />
    </Glyph>
  ),
  lookup: (
    <Glyph>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </Glyph>
  ),
  retrieve: (
    <Glyph>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 8H20" />
    </Glyph>
  ),
  reason: (
    <Glyph>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </Glyph>
  ),
  act: (
    <Glyph>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
    </Glyph>
  ),
  reply: (
    <Glyph>
      <path d="M5 6h14v9H8l-3 3z" />
    </Glyph>
  ),
};

/** Icon column is in normal flow so the marker cannot cover the step text. */
export default function Timeline({ steps }: { steps: AgentStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={`${step.kind}-${index}`} className="rise grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
          <div className="relative flex justify-center">
            {index < steps.length - 1 && (
              <span className="absolute top-8 bottom-[-1rem] left-1/2 w-px -translate-x-1/2 bg-black/10" aria-hidden="true" />
            )}
            <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-ink">
              {ICON[step.kind]}
            </span>
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="text-[15px] font-medium leading-snug">{step.title}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

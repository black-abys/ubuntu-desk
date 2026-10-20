import type { AgentStep } from "@/lib/types";

const ICON: Record<AgentStep["kind"], string> = {
  listen: "🎙",
  translate: "🌍",
  lookup: "🗄",
  retrieve: "📚",
  reason: "🧠",
  act: "⚡",
  reply: "💬",
};

/** Icon column is in normal flow so the marker cannot cover the step text. */
export default function Timeline({ steps }: { steps: AgentStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={`${step.kind}-${index}`} className="rise grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3">
          <div className="relative flex justify-center">
            {index < steps.length - 1 && (
              <span className="absolute top-9 bottom-[-1rem] left-1/2 w-px -translate-x-1/2 bg-white/15" aria-hidden="true" />
            )}
            <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0c1220] text-[15px] leading-none ring-1 ring-emerald-400/50">
              <span aria-hidden="true">{ICON[step.kind]}</span>
            </span>
          </div>
          <div className="min-w-0 pt-1">
            <div className="text-sm font-medium leading-snug">{step.title}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

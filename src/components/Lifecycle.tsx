import { DISPUTE_FLOW, STATUS_LABEL } from "@/lib/labels";
import type { DisputeStatus } from "@/lib/types";

export default function Lifecycle({ status }: { status: DisputeStatus }) {
  const current = DISPUTE_FLOW.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Case lifecycle">
      {DISPUTE_FLOW.map((item, index) => {
        const state = index === current ? "current" : index < current ? "done" : "upcoming";
        return (
          <li key={item} className="flex items-center gap-1">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                state === "current"
                  ? "bg-emerald-400 text-black"
                  : state === "done"
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-white/5 text-slate-500"
              }`}
              aria-current={state === "current" ? "step" : undefined}
            >
              {STATUS_LABEL[item]}
            </span>
            {index < DISPUTE_FLOW.length - 1 && <span className="px-0.5 text-slate-600" aria-hidden="true">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

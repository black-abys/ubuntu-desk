import { DISPUTE_FLOW, STATUS_LABEL } from "@/lib/labels";
import type { DisputeStatus } from "@/lib/types";

export default function Lifecycle({ status }: { status: DisputeStatus }) {
  const current = DISPUTE_FLOW.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2" aria-label="Case lifecycle">
      {DISPUTE_FLOW.map((item, index) => {
        const state = index === current ? "current" : index < current ? "done" : "upcoming";
        return (
          <li key={item} className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-3 py-1 text-[13px] font-medium leading-snug ${
                state === "current"
                  ? "bg-ink text-white"
                  : state === "done"
                    ? "bg-[#e8e8ed] text-ink"
                    : "bg-white text-muted ring-1 ring-black/10"
              }`}
              aria-current={state === "current" ? "step" : undefined}
            >
              {STATUS_LABEL[item]}
            </span>
            {index < DISPUTE_FLOW.length - 1 && (
              <span className="text-muted" aria-hidden="true">
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

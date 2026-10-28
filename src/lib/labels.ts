import type { DisputeStatus, FindingLabel } from "@/lib/types";

export const DISPUTE_FLOW: DisputeStatus[] = ["draft", "submitted", "under_review", "resolved"];

export const STATUS_LABEL: Record<DisputeStatus, string> = {
  draft: "Draft",
  submitted: "Submitted (simulated)",
  under_review: "Under review",
  resolved: "Resolved",
};

export const FINDING_TITLE: Record<FindingLabel, string> = {
  "potential billing error": "Potential billing error",
  "no potential error in these figures": "No potential error in these figures",
  "needs reconciliation": "Needs reconciliation",
};

export const NEXT_STATUS: Partial<Record<DisputeStatus, DisputeStatus>> = {
  submitted: "under_review",
  under_review: "resolved",
};

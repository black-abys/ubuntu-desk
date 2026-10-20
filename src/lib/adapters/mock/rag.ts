import type { RagClient } from "@/lib/types";

/** Fixed demo clauses. Scores are fixtures, not a live REMi evaluation. */
export const mockRag: RagClient = {
  async ask() {
    return {
      simulated: true,
      answer:
        "Where a meter reading is estimated, the account must be adjusted to actual consumption once a reading is obtained, and an estimate may not exceed the average of the previous three actual readings by more than 20% without a site inspection.",
      citations: [
        {
          docTitle: "City Electricity Tariff & Credit Control By-law 2026/27",
          clause: "§14.3 Estimated consumption",
          page: 22,
          text: "An estimated reading shall be based on the average consumption of the preceding three actual readings and shall not exceed such average by more than twenty percent (20%) unless a site inspection has been conducted.",
        },
        {
          docTitle: "Customer Service Charter",
          clause: "§6.1 Billing disputes",
          page: 4,
          text: "A customer may lodge a billing dispute; collection actions on the disputed amount are suspended pending resolution within 30 days.",
        },
      ],
      remi: { answerRelevance: 0.95, contextRelevance: 0.91, groundedness: 0.97 },
    };
  },
};

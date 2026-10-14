import type { RagClient } from "@/lib/types";

/**
 * Progress Agentic RAG adapter (fill in once you have a Knowledge Box at rag.progress.cloud).
 * Expected env: RAG_API_URL, RAG_KB_ID, RAG_API_KEY.
 * TODO: confirm exact endpoint/payload from the Progress docs + starter kit; map the
 * response's citations and REMi scores into RagAnswer.
 */
export const progressRag: RagClient = {
  async ask(question, opts) {
    const r = await fetch(`${process.env.RAG_API_URL}/kb/${process.env.RAG_KB_ID}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": process.env.RAG_API_KEY ?? "" },
      body: JSON.stringify({ query: question, language: opts?.lang }),
    });
    if (!r.ok) throw new Error(`Agentic RAG ${r.status}`);
    const j = await r.json();
    return {
      answer: j.answer ?? "",
      citations: j.citations ?? [],
      remi: j.remi ?? { answerRelevance: 0, contextRelevance: 0, groundedness: 0 },
    };
  },
};

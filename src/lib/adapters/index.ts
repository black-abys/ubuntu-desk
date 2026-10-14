import type { OpenEdgeClient, RagClient } from "@/lib/types";
import { mockOpenEdge } from "./mock/openedge";
import { mockRag } from "./mock/rag";
import { pasoeOpenEdge } from "./real/openedge";
import { progressRag } from "./real/rag";

/** Swap backends with env: USE_REAL_OPENEDGE=1, USE_REAL_RAG=1 */
export const openedgeClient: OpenEdgeClient = process.env.USE_REAL_OPENEDGE === "1" ? pasoeOpenEdge : mockOpenEdge;
export const ragClient: RagClient = process.env.USE_REAL_RAG === "1" ? progressRag : mockRag;

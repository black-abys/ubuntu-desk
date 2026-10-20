import type { DocumentStore, OcrClient, OpenEdgeClient, RagClient } from "@/lib/types";
import { memoryDocumentStore } from "./mock/documents";
import { mockOcr } from "./mock/ocr";
import { mockOpenEdge } from "./mock/openedge";
import { mockRag } from "./mock/rag";
import { remoteDocumentStore } from "./real/documents";
import { remoteOcr } from "./real/ocr";
import { pasoeOpenEdge } from "./real/openedge";
import { progressRag } from "./real/rag";

/**
 * Swap backends with env. Unset means the simulated adapter.
 * USE_REAL_OPENEDGE=1  OPENEDGE_BASE_URL  OPENEDGE_TOKEN
 * USE_REAL_RAG=1       RAG_API_URL  RAG_KB_ID  RAG_API_KEY
 * USE_REAL_OCR=1       OCR_API_URL  OCR_API_KEY
 * USE_REAL_DOCUMENTS=1 DOCUMENT_STORE_URL  DOCUMENT_STORE_TOKEN
 * Real adapters are scaffolds. Selecting one does not mean a live municipality is connected.
 */
export const openedgeClient: OpenEdgeClient = process.env.USE_REAL_OPENEDGE === "1" ? pasoeOpenEdge : mockOpenEdge;
export const ragClient: RagClient = process.env.USE_REAL_RAG === "1" ? progressRag : mockRag;
export const ocrClient: OcrClient = process.env.USE_REAL_OCR === "1" ? remoteOcr : mockOcr;
export const documentStore: DocumentStore = process.env.USE_REAL_DOCUMENTS === "1" ? remoteDocumentStore : memoryDocumentStore;

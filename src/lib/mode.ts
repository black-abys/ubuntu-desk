import type { BackendMode } from "@/lib/types";

function flag(name: string): BackendMode["openedge"] {
  return process.env[name] === "1" ? "real-unverified" : "simulated";
}

/** Which adapter is selected. "real-unverified" only means the env switch is on. */
export function backendMode(): BackendMode {
  return {
    openedge: flag("USE_REAL_OPENEDGE"),
    rag: flag("USE_REAL_RAG"),
    ocr: flag("USE_REAL_OCR"),
    documents: flag("USE_REAL_DOCUMENTS"),
  };
}

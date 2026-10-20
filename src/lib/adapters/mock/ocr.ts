import type { OcrClient, OcrExtraction, OcrRequest } from "@/lib/types";

const FIXTURE: OcrExtraction = {
  provider: "simulated",
  simulated: true,
  basis: "unread-file",
  accountNo: "JHB-4471-0093",
  holder: "N. Dlamini",
  period: "2026-09",
  kwh: 1020,
  total: 3107,
  estimated: true,
  fieldConfidence: null,
  note: "Simulated OCR. No provider read this file. The fields are the bundled sample bill so the demo can continue.",
};

function num(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Match labelled text only. File contents are never sent to a model. */
export function extractFromText(text: string): OcrExtraction | null {
  const accountNo = text.match(/\b[A-Z]{3}-\d{4}-\d{4}\b/)?.[0] ?? null;
  const period = text.match(/\b20\d{2}-(0[1-9]|1[0-2])\b/)?.[0] ?? null;
  const holder = text.match(/Account holder:\s*([^\n<]+)/i)?.[1]?.trim() ?? null;
  const kwh = num(text.match(/(\d[\d,]*(?:\.\d+)?)\s*kWh/i)?.[1]);
  const total = num(text.match(/Total due[:\s]*R?\s*([\d,]+(?:\.\d{2})?)/i)?.[1]);
  const estimated = /estimated:\s*yes/i.test(text) ? true : /estimated:\s*no/i.test(text) ? false : null;
  if (!accountNo || !period || total == null) return null;
  const found = [accountNo, period, holder, kwh, total, estimated].filter((v) => v != null).length;
  return {
    provider: "simulated",
    simulated: true,
    basis: "file-text",
    accountNo,
    holder,
    period,
    kwh,
    total,
    estimated,
    fieldConfidence: Math.round((found / 6) * 100) / 100,
    note: "Simulated extractor matched labelled text inside the file. It is not an OCR engine and did not interpret a photo.",
  };
}

export const mockOcr: OcrClient = {
  async extract(input: OcrRequest): Promise<OcrExtraction> {
    if (input.useSample) {
      return {
        ...FIXTURE,
        basis: "sample-bill",
        note: "Simulated OCR of the bundled sample bill (public/sample-bill.svg). No OCR provider is connected.",
      };
    }
    const fromFile = input.textSnippet ? extractFromText(input.textSnippet) : null;
    if (fromFile) return fromFile;
    return {
      ...FIXTURE,
      note: `Simulated OCR. “${input.fileName || "upload"}” was stored, but no OCR provider read it. Fields below are the bundled sample bill, not a transcription of this file.`,
    };
  },
};

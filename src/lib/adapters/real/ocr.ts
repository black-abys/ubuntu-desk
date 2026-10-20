import type { OcrClient } from "@/lib/types";

/**
 * OCR provider scaffold.
 * Expected env: OCR_API_URL, OCR_API_KEY.
 * Leave USE_REAL_OCR unset until a provider is chosen. Do not commit keys.
 * The mock adapter must keep labelling extractions as simulated.
 */
export const remoteOcr: OcrClient = {
  async extract(input) {
    const url = process.env.OCR_API_URL;
    if (!url) throw new Error("OCR_API_URL is not set");
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OCR_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        fileName: input.fileName,
        mimeType: input.mimeType,
        textSnippet: input.textSnippet ?? null,
      }),
    });
    if (!r.ok) throw new Error(`OCR provider ${r.status}`);
    const j = await r.json();
    return {
      provider: "remote",
      simulated: false,
      basis: "file-text",
      accountNo: j.accountNo ?? null,
      holder: j.holder ?? null,
      period: j.period ?? null,
      kwh: j.kwh ?? null,
      total: j.total ?? null,
      estimated: j.estimated ?? null,
      fieldConfidence: typeof j.fieldConfidence === "number" ? j.fieldConfidence : null,
      note: j.note ?? "Remote OCR adapter response.",
    };
  },
};

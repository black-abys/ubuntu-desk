"use client";

import { useEffect, useRef, useState } from "react";
import { formatRand } from "@/lib/billing";
import { STATUS_LABEL } from "@/lib/labels";
import type { BillAnalysis, Citation, Dispute, DocumentCategory, OcrExtraction, RagAnswer, VaultDocument } from "@/lib/types";

const CATEGORIES: { id: DocumentCategory; label: string }[] = [
  { id: "bill", label: "Bill" },
  { id: "meter", label: "Meter photo" },
  { id: "receipt", label: "Receipt" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "other", label: "Other" },
];

export interface ScanPayload {
  document: VaultDocument;
  analysis: BillAnalysis | null;
  citations: Citation[] | null;
  remi: RagAnswer["remi"] | null;
  accountError?: string | null;
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || `Request failed (${response.status})`;
}

function basisCopy(extraction: OcrExtraction): string {
  if (extraction.basis === "sample-bill") {
    return "Simulated OCR of the bundled sample bill. No OCR provider read an image.";
  }
  if (extraction.basis === "file-text") {
    return "Simulated text match on labels inside the file. This is not an OCR engine, and the score below is not retrieval groundedness.";
  }
  return "Simulated OCR. This file was not read. The numbers below are the bundled sample bill, not a transcription of your photo or PDF.";
}

export default function ScanWorkspace({
  documents,
  disputes,
  loadSample,
  onSaved,
  onLinked,
}: {
  documents: VaultDocument[];
  disputes: Dispute[];
  loadSample: boolean;
  onSaved: (payload: ScanPayload) => void;
  onLinked: (document: VaultDocument) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampled = useRef(false);
  const [category, setCategory] = useState<DocumentCategory>("bill");
  const [filter, setFilter] = useState<DocumentCategory | "all">("all");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ name: string; mimeType: string; byteSize: number; dataUrl: string | null; textSnippet: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [linkTo, setLinkTo] = useState(disputes[0]?.disputeId ?? "");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (disputes.some((d) => d.disputeId === linkTo)) return;
    setLinkTo(disputes[0]?.disputeId ?? "");
  }, [disputes, linkTo]);

  async function save(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as ScanPayload;
      setActiveId(payload.document.documentId);
      setPending(null);
      if (payload.accountError) setError(payload.accountError);
      onSaved(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the document");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!loadSample || sampled.current) return;
    sampled.current = true;
    void save({ useSample: true, category: "bill", fileName: "sample-municipal-bill.svg", mimeType: "image/svg+xml", byteSize: 0 });
    // The sample load is a one-shot demo hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSample]);

  async function startCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser has no camera API. Upload a file, or load the sample bill.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setCameraError("Camera permission was blocked. You can still upload a file or load the sample bill.");
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOn || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => setCameraError("The camera preview could not start. Upload a file or load the sample bill."));
  }, [cameraOn]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const scale = Math.min(1, 960 / (video.videoWidth || 960));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((video.videoWidth || 640) * scale));
    canvas.height = Math.max(1, Math.round((video.videoHeight || 480) * scale));
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    setPending({
      name: `camera-${new Date().toISOString().slice(0, 19)}.jpg`,
      mimeType: "image/jpeg",
      byteSize: Math.round((dataUrl.length * 3) / 4),
      dataUrl: dataUrl.length <= 400_000 ? dataUrl : null,
      textSnippet: null,
    });
    stopCamera();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    let textSnippet: string | null = null;
    const textual = /svg|xml|text|pdf/i.test(file.type) || file.name.endsWith(".svg");
    if (textual && file.size <= 1_500_000) textSnippet = (await file.text()).slice(0, 8000);
    let dataUrl: string | null = null;
    if (/^image\/(png|jpeg|webp)$/.test(file.type) && file.size <= 280_000) {
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
        reader.readAsDataURL(file);
      });
    }
    setPending({ name: file.name, mimeType: file.type || "application/octet-stream", byteSize: file.size, dataUrl, textSnippet });
  }

  async function linkActive() {
    const documentId = activeId;
    if (!documentId || !linkTo) return;
    setLinking(true);
    setError(null);
    try {
      const response = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, disputeId: linkTo }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const body = (await response.json()) as { document: VaultDocument };
      onLinked(body.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link the document");
    } finally {
      setLinking(false);
    }
  }

  const active = documents.find((doc) => doc.documentId === activeId) ?? null;
  const visible = documents.filter((doc) => filter === "all" || doc.category === filter);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <section className="card p-5 sm:p-6 lg:col-span-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Scan a document</h2>
          <span className="honesty">Simulated OCR</span>
        </div>
        <p className="quiet mb-5">
          Capture a photo or upload a bill, meter photo, receipt, or PDF. Files stay in this demo vault. Their text is not sent to a model. OCR stays simulated until a real provider is connected.
        </p>
        <label className="mb-4 block text-[13px] font-semibold text-muted">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as DocumentCategory)}
            className="field mt-1.5"
          >
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => save({ useSample: true, category: "bill", fileName: "sample-municipal-bill.svg", mimeType: "image/svg+xml", byteSize: 0 })} disabled={busy}
            className="btn-primary">
            Load sample bill
          </button>
          <button type="button" onClick={cameraOn ? stopCamera : startCamera} className="btn-secondary">
            {cameraOn ? "Close camera" : "Open camera"}
          </button>
          <label className="btn-secondary cursor-pointer">
            Upload image or PDF
            <input type="file" accept="image/*,application/pdf,.pdf,.svg" className="sr-only" onChange={(event) => void onFile(event.target.files?.[0])} />
          </label>
        </div>
        {cameraError && <p className="notice mt-4 px-3.5 py-3 text-[13px] leading-relaxed" role="alert">{cameraError}</p>}
        {cameraOn && (
          <div className="mt-4 space-y-3">
            <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full rounded-2xl bg-ink object-cover" />
            <button type="button" onClick={capture} className="btn-secondary w-full">Capture frame</button>
          </div>
        )}
        {pending && (
          <div className="inset mt-4 p-4 text-[14px]">
            <div className="font-medium text-ink">{pending.name}</div>
            <p className="quiet mt-1">Ready to store in the demo vault. Saving a bill runs simulated extraction.</p>
            {pending.dataUrl && (
              // User-captured data URLs are not served by the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pending.dataUrl} alt="Captured frame preview" className="mt-3 max-h-48 w-full rounded-xl bg-white object-contain" />
            )}
            <button type="button" disabled={busy} onClick={() => save({ ...pending, fileName: pending.name, category, dataUrl: pending.dataUrl, useSample: false })}
              className="btn-primary mt-3 w-full">
              {busy ? "Saving…" : "Save to vault"}
            </button>
          </div>
        )}
        {error && <p className="alert mt-4 px-3.5 py-3 text-[13px] leading-relaxed" role="alert">{error}</p>}
      </section>

      <section className="card p-5 sm:p-6 lg:col-span-7" aria-live="polite">
        <h2 className="section-title mb-4">Latest extraction</h2>
        {!active?.extraction && <p className="text-[15px] leading-relaxed text-muted">Load the sample bill to extract an account number, period, and total. Other categories are stored without bill maths.</p>}
        {active?.extraction && (
          <div className="space-y-4">
            <div className="notice px-4 py-3 text-[14px] leading-relaxed">
              {basisCopy(active.extraction)}
            </div>
            <dl className="grid grid-cols-1 gap-2 text-[15px] sm:grid-cols-2">
              <Field label="Account" value={active.extraction.accountNo} />
              <Field label="Holder" value={active.extraction.holder} />
              <Field label="Period" value={active.extraction.period} />
              <Field label="Units" value={active.extraction.kwh != null ? `${active.extraction.kwh} kWh` : null} />
              <Field label="Total" value={active.extraction.total != null ? formatRand(active.extraction.total) : null} />
              <Field label="Estimated" value={active.extraction.estimated == null ? null : active.extraction.estimated ? "yes" : "no"} />
            </dl>
            <p className="quiet">
              {active.extraction.fieldConfidence == null
                ? "OCR field confidence: not available. No engine scored a real read of this file."
                : `Text-match confidence: ${Math.round(active.extraction.fieldConfidence * 100)}%. This only counts labelled text found in the file. It is not speech confidence, retrieval groundedness, or a trust score.`}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 text-[13px] font-semibold text-muted">
                Link to case
                <select value={linkTo} onChange={(event) => setLinkTo(event.target.value)} className="field mt-1.5 font-normal">
                  {disputes.length === 0 && <option value="">No cases yet</option>}
                  {disputes.map((dispute) => (
                    <option key={dispute.disputeId} value={dispute.disputeId}>{dispute.disputeId} · {STATUS_LABEL[dispute.status]}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void linkActive()} disabled={!linkTo || linking} className="btn-secondary">
                {linking ? "Linking…" : "Link document"}
              </button>
            </div>
            {(active.previewPath || active.previewDataUrl) && (
              // Sample SVG and in-memory previews are local demo files, not remote assets.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.previewDataUrl ?? active.previewPath ?? ""} alt={`Stored preview of ${active.fileName}`} className="max-h-80 w-full rounded-2xl bg-[#f4f0e6] object-contain" />
            )}
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6 lg:col-span-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Document vault</h2>
          <span className="honesty">In-memory demo store · not municipal storage</span>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="All" current={filter === "all"} onClick={() => setFilter("all")} />
          {CATEGORIES.map((item) => (
            <FilterChip key={item.id} label={item.label} current={filter === item.id} onClick={() => setFilter(item.id)} />
          ))}
        </div>
        {visible.length === 0 && <p className="text-[15px] text-muted">Nothing in this category yet.</p>}
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((doc) => (
            <li key={doc.documentId}>
              <button type="button" onClick={() => setActiveId(doc.documentId)} className={`w-full rounded-2xl border p-4 text-left ${doc.documentId === active?.documentId ? "border-ink bg-paper" : "border-black/10 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-medium">{doc.fileName}</div>
                    <div className="quiet mt-1">{doc.category} · {doc.documentId}</div>
                  </div>
                  {doc.extraction?.simulated && <span className="honesty shrink-0">Simulated OCR</span>}
                </div>
                <p className="quiet mt-2">
                  {doc.linkedDisputeId ? `Linked to ${doc.linkedDisputeId}` : "Not linked to a case"}
                  {doc.extraction?.accountNo ? ` · ${doc.extraction.accountNo}` : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="inset px-3.5 py-2.5">
      <dt className="text-[12px] font-semibold text-muted">{label}</dt>
      <dd className="nums text-ink">{value ?? "—"}</dd>
    </div>
  );
}

function FilterChip({ label, current, onClick }: { label: string; current: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={current} className="chip">
      {label}
    </button>
  );
}

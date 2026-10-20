"use client";

import { useEffect, useRef, useState } from "react";
import { formatRand } from "@/lib/billing";
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
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="glass rounded-2xl p-4 sm:p-5 lg:col-span-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-300">Scan a document</h2>
          <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-[11px] text-amber-200">Simulated OCR</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          Capture a photo or upload a bill, meter photo, receipt, or PDF. Files stay in this demo vault. Their text is not sent to a model. OCR stays simulated until a real provider is connected.
        </p>
        <label className="mb-3 block text-xs text-slate-400">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as DocumentCategory)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100"
          >
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => save({ useSample: true, category: "bill", fileName: "sample-municipal-bill.svg", mimeType: "image/svg+xml", byteSize: 0 })} disabled={busy}
            className="rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-black disabled:opacity-50">
            Load sample bill
          </button>
          <button type="button" onClick={cameraOn ? stopCamera : startCamera} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-100">
            {cameraOn ? "Close camera" : "Open camera"}
          </button>
          <label className="cursor-pointer rounded-xl border border-white/15 px-3 py-2 text-center text-sm text-slate-100">
            Upload image or PDF
            <input type="file" accept="image/*,application/pdf,.pdf,.svg" className="sr-only" onChange={(event) => void onFile(event.target.files?.[0])} />
          </label>
        </div>
        {cameraError && <p className="mt-3 text-xs text-amber-200" role="alert">{cameraError}</p>}
        {cameraOn && (
          <div className="mt-4 space-y-2">
            <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full rounded-xl bg-black object-cover" />
            <button type="button" onClick={capture} className="w-full rounded-xl bg-white/10 py-2 text-sm">Capture frame</button>
          </div>
        )}
        {pending && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
            <div className="font-medium text-slate-200">{pending.name}</div>
            <p className="mt-1 text-slate-500">Ready to store in the demo vault. Saving a bill runs simulated extraction.</p>
            {pending.dataUrl && (
              // User-captured data URLs are not served by the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pending.dataUrl} alt="Captured frame preview" className="mt-3 max-h-48 w-full rounded-lg object-contain" />
            )}
            <button type="button" disabled={busy} onClick={() => save({ ...pending, fileName: pending.name, category, dataUrl: pending.dataUrl, useSample: false })}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-indigo-500 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {busy ? "Saving…" : "Save to vault"}
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-xs text-rose-300" role="alert">{error}</p>}
      </section>

      <section className="glass rounded-2xl p-4 sm:p-5 lg:col-span-7" aria-live="polite">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Latest extraction</h2>
        {!active?.extraction && <p className="text-sm text-slate-500">Load the sample bill to extract an account number, period, and total. Other categories are stored without bill maths.</p>}
        {active?.extraction && (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-50">
              {basisCopy(active.extraction)}
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <Field label="Account" value={active.extraction.accountNo} />
              <Field label="Holder" value={active.extraction.holder} />
              <Field label="Period" value={active.extraction.period} />
              <Field label="Units" value={active.extraction.kwh != null ? `${active.extraction.kwh} kWh` : null} />
              <Field label="Total" value={active.extraction.total != null ? formatRand(active.extraction.total) : null} />
              <Field label="Estimated" value={active.extraction.estimated == null ? null : active.extraction.estimated ? "yes" : "no"} />
            </dl>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {active.extraction.fieldConfidence == null
                ? "OCR field confidence: not available. No engine scored a real read of this file."
                : `Text-match confidence: ${Math.round(active.extraction.fieldConfidence * 100)}%. This only counts labelled text found in the file. It is not speech confidence, retrieval groundedness, or a trust score.`}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex-1 text-xs text-slate-400">
                Link to case
                <select value={linkTo} onChange={(event) => setLinkTo(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100">
                  {disputes.length === 0 && <option value="">No cases yet</option>}
                  {disputes.map((dispute) => (
                    <option key={dispute.disputeId} value={dispute.disputeId}>{dispute.disputeId} · {dispute.status}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void linkActive()} disabled={!linkTo || linking} className="rounded-xl border border-white/15 px-3 py-2 text-sm sm:self-end">
                {linking ? "Linking…" : "Link document"}
              </button>
            </div>
            {(active.previewPath || active.previewDataUrl) && (
              // Sample SVG and in-memory previews are local demo files, not remote assets.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.previewDataUrl ?? active.previewPath ?? ""} alt={`Stored preview of ${active.fileName}`} className="max-h-80 w-full rounded-xl bg-[#f4f0e6] object-contain" />
            )}
          </div>
        )}
      </section>

      <section className="glass rounded-2xl p-4 sm:p-5 lg:col-span-12">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-300">Document vault</h2>
          <span className="text-[11px] text-slate-500">In-memory demo store · not municipal storage</span>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="All" current={filter === "all"} onClick={() => setFilter("all")} />
          {CATEGORIES.map((item) => (
            <FilterChip key={item.id} label={item.label} current={filter === item.id} onClick={() => setFilter(item.id)} />
          ))}
        </div>
        {visible.length === 0 && <p className="text-sm text-slate-500">Nothing in this category yet.</p>}
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((doc) => (
            <li key={doc.documentId}>
              <button type="button" onClick={() => setActiveId(doc.documentId)} className={`w-full rounded-xl border p-3 text-left ${doc.documentId === active?.documentId ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-black/30"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{doc.fileName}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{doc.category} · {doc.documentId}</div>
                  </div>
                  {doc.extraction?.simulated && <span className="shrink-0 rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] text-amber-200">Simulated OCR</span>}
                </div>
                <p className="mt-2 text-xs text-slate-400">
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
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-slate-100">{value ?? "—"}</dd>
    </div>
  );
}

function FilterChip({ label, current, onClick }: { label: string; current: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 rounded-full px-3 py-1 text-xs ${current ? "bg-emerald-400 text-black" : "glass text-slate-300"}`}>
      {label}
    </button>
  );
}

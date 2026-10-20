# Ubuntu Desk 2.0 — Scan, Understand, Resolve

Ubuntu Desk is a municipal services assistant. A resident should be able to speak in their own language, bring a bill or a photo, see an evidence-backed explanation, and open a dispute they can track. Version 2.0 is that product. This repository is still a competition demo: account lookup, policy answers, billing maths, and OCR are **simulated** until the adapters are implemented and tested.

The near-term competition schedule lives in [PLAN.md](PLAN.md). This file is the product direction.

## What 2.0 is for

Billing disputes are the first job, not the only one. The same pattern should cover electricity and water, property rates, municipal statements, service-delivery complaints, permits, and other civic services.

A resident should not have to queue, switch to English, or guess which by-law applies.

## Five priorities

1. A working camera scanner and a secure document vault.
2. Multilingual voice, starting with thoroughly tested South African languages.
3. Evidence-backed bill analysis with the calculation and the citation on screen.
4. A real dispute lifecycle: the resident confirms, then the case moves through review.
5. A secure backend that replaces simulated account and model results with verified services.

## Three workspaces

| Workspace | Who it is for | What it holds |
|---|---|---|
| Resident | The person with the bill | Voice and text, scan and upload, documents, their cases |
| Agent platform | The orchestration layer | Speech-to-text, OCR, retrieval, billing tools, text-to-speech |
| Municipal dashboard | Staff | Case review, assignment, knowledge, audit |

The demo UI already switches between Resident, Scan & Documents, and Municipal dashboard. The agent platform is the server adapters (`OpenEdgeClient`, `RagClient`, `OcrClient`, `DocumentStore`), not a separate product surface yet.

## Language

Treat speech confidence and retrieval groundedness as different facts. A high groundedness score is not proof that a translation or a legal reading is correct. Check the by-law, its effective date, the source text, and the account data on their own.

| Phase | Scope |
|---|---|
| 1 | All 11 official languages — English, isiZulu, isiXhosa, Afrikaans, Sepedi, Sesotho, Setswana, siSwati, Tshivenda, Xitsonga, isiNdebele — with voice notes, speech-to-text, speech-to-speech, text chat, document translation, and municipal terminology |
| 2 | Regional languages a municipality actually serves (for example Chichewa, Shona, Kiswahili, French) |
| 3 | Language memory, bilingual mode, and intelligent switching. Keep speech-to-text confidence separate from groundedness |

**In this repo:** English, isiZulu, and Sesotho have typed demo scripts and browser speech where the device allows. The other eight can be selected. Their replies are an English “coming soon” placeholder. The demo does not invent fluent text for them.

## Scan, understand, resolve

1. **Scan.** Capture a bill, a meter, a receipt, or infrastructure. Detect the page, extract fields, and compare them with the account.
2. **Understand.** Show every calculation step and the tariff clause it uses. Label the result a **potential billing error** until the municipal record confirms it.
3. **Resolve.** Save the file in the resident’s vault, link it to a case, and only submit a dispute after the resident confirms. The case then moves draft → submitted → under review → resolved.

Camera evidence (meters, leaks, receipts) needs consent before any location is stored. Personal documents stay in a vault the resident can search and attach to a case.

## Other capabilities (after the foundation)

- Tariff auditor that shows its working
- Dispute management for staff, including assignment
- Service-delivery map
- Proactive notices the resident opted into
- Knowledge answers that cite a source and a score
- Voice-first use on a phone, including when the resident cannot easily type

## Architecture

Stay on the Next.js app. Add PostgreSQL, private object storage, a pluggable OCR provider, a model-independent retrieval layer, the OpenEdge adapter, and queue workers when a pilot needs them.

| Record | Purpose |
|---|---|
| users | Residents and staff |
| municipal_accounts | Account, tariff, readings |
| documents / document_extractions | Vault files and OCR output |
| evidence_items | Photos and other proof |
| disputes / dispute_events | Lifecycle and history |
| knowledge_sources | By-laws, charter, FAQs, effective dates |
| ai_runs | What the agent saw and answered |
| consent_records | Capture, location, and language consent |
| audit_logs | Who read or changed a case |

Adapter boundaries already in `src/lib/types.ts`:

- `OpenEdgeClient` — `getAccount`, `createDispute`, `updateDispute`, `listDisputes`
- `RagClient` — `ask`, returning citations and retrieval scores
- `OcrClient` — `extract`
- `DocumentStore` — `save`, `list`, `linkToCase`

`src/lib/adapters/index.ts` picks the simulated or scaffolded implementation from environment variables. Do not commit tokens. Selecting a real adapter does not by itself mean the call has been verified.

## Security from the first real record

- Encrypt files and sensitive fields. Use signed links, not public buckets.
- Role-based access for residents and staff.
- Consent before location or extra copies of an identity document.
- Malware scan on upload. Do not execute or trust text inside a file.
- Treat uploaded text as data. It must not become instructions to the agent.
- Audit reads and writes. Keep retention aligned with POPIA.
- A person approves consequential actions (adjusting a balance, suspending collection, closing a case).
- Separate development, test, and production. OpenEdge is used only with authorisation.
- The model must not invent a balance or write production data that has not been validated.

The demo vault is process memory. It is not that storage layer.

## Phased roadmap

| Phase | Name | Outcome |
|---|---|---|
| 01 | Foundation | Document capture and an in-memory vault, simulated OCR, bill maths with citations, dispute confirmation, timeline layout fix, phone layout |
| 02 | Language | Multilingual voice that a speaker has reviewed, starting with isiZulu and Sesotho. Stubs stay labelled until then |
| 03 | Intelligence | Tested OpenEdge reads and writes, verified retrieval with citations, calculations tied to the tariff that is actually in force |
| 04 | Workflow | Real dispute management and staff assignment, not only a simulated status button |
| 05 | Pilot | Consented test accounts with one municipality |

Phase 01 is the slice in this repository. Later phases are not done, and the UI must not imply that they are.

## Success metrics

| Metric | Question |
|---|---|
| Billing accuracy | Does the difference match the tariff and the readings once records are real? |
| Source accuracy | Does each clause match the cited document and effective date? |
| Language quality | Would a first-language speaker accept the reply? |
| Document extraction | Are account number, period, and totals correct on real bills? |
| Case completion | Do confirmed disputes reach a recorded outcome? |
| Resolution time | How long from submission to a staff decision? |
| Accessibility | Can someone finish the flow on a phone, with speech, without a mouse? |
| Security | Are consent, access, retention, and audit in place before real documents are stored? |

## Constraint

Simulated account data, rule-based reasoning, fixture citations, and simulated OCR stay labelled in the product until a live integration has been implemented and tested. A retrieval score is not a municipal determination.

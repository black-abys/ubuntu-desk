# Ubuntu Desk: competition plan (through 29 Oct 2026)

Product direction for 2.0 is **[ROADMAP.md](ROADMAP.md)** — Scan, Understand, Resolve. This file is only the plan for the AIGS / Progress OpenEdge Innovation Challenge.

**Submit by Wednesday 28 Oct 2026, 14:00 SAST, on GitHub.** Late entries are not accepted. **Present on Thursday 29 Oct.**

## What is true in this build

The running app uses simulated OpenEdge records, simulated Agentic RAG clauses, rule-based billing checks, and simulated OCR. Those paths are labelled in the UI. Do not describe them as a live municipal connection, and do not describe a retrieval score as proof of a translation.

The real adapters in `src/lib/adapters/real/` are scaffolds. Filling them in is a stretch goal if Progress access is actually available. The submission still stands on the labelled demo if it is not.

## Ship this before 28 Oct

1. Resident demo in English, isiZulu, and Sesotho (typed, and spoken where the browser allows). The other eight official languages stay selectable with an honest “coming soon” reply.
2. Scan & Documents: sample bill, upload or camera, simulated OCR, in-memory vault, calculation steps, citations, and the words **potential billing error**.
3. Dispute confirmation, then the lifecycle draft → submitted → under review → resolved on the simulated dashboard.
4. Phone layout, including the timeline (icons must not sit on top of the step text).
5. README, this plan, and ROADMAP.md matching what the demo actually does.
6. Pitch and a backup video that use the same wording as the UI.

## Dates

| Date | Goal |
|---|---|
| Thu 15 Oct | Register. Join the Discord. |
| Fri 16–Sun 18 Oct | Starter kit, draft schema, public tariff and charter PDFs, first mock demo. |
| Mon 19 Oct | Kick-off in Midrand. Map Ubuntu Desk to an official use case. Ask Progress about OpenEdge and Agentic RAG access. Start a trial if it is offered. |
| Tue 20 Oct | Foundation slice in [ROADMAP.md](ROADMAP.md): languages, scan vault, bill maths, confirmation, honest labels. Do not block on a live PASOE service. |
| Wed 21 Oct | Read the isiZulu and Sesotho demo scripts with a speaker if you can. Keep the other eight languages on the coming-soon path. |
| Thu 22 Oct | If OpenEdge access exists, spike `real/openedge.ts` against the starter kit and test one account read. If it does not, rehearse the simulated path and say so. |
| Fri 23 Oct | If a Knowledge Box exists, spike `real/rag.ts` and map real citations. If it does not, keep the fixture clauses labelled as a demo. |
| Sat 24 Oct | Only add another scenario if it stays labelled, including a bill the check correctly leaves alone. |
| Sun 25 Oct | Phone pass, contrast and focus, pitch slides. |
| Mon 26 Oct | README, screenshots, backup video of the labelled demo. |
| Tue 27 Oct | Freeze features. Rehearse the pitch three times with a timer. |
| **Wed 28 Oct** | Final check. **Push before 12:00 SAST** (two hours before the 14:00 deadline). |
| Thu 29 Oct | Present. Bring the simulated demo and the recording. |

## Pitch outline (~5 min)

1. **Hook (30s).** A Soweto household’s electricity bill jumped from about R1,200 to R3,107. Show the queue, then the phone.
2. **Problem (30s).** Estimated readings, language, and by-laws nobody can quote.
3. **Live demo (2 min).** A voice note in isiZulu. Reasoning on simulated records. The §14.3 citation. Say clearly that the groundedness figure is a **demo retrieval score**, not speech confidence and not a legal sign-off. Show the difference as a **potential billing error**. The resident confirms. The case appears on the dashboard. The spoken reply uses the demo script.
4. **How it works (45s).** Next.js, swappable OpenEdge and RAG adapters, OCR and document-store interfaces. On stage, those backends are simulated unless a tested connection is actually up.
5. **Trust (20s).** Citations, a separate speech-confidence line, confirmation before submit, no claim that collection was suspended.
6. **Impact (30s).** About 260 municipalities, 11 official languages on the roadmap, the same case pattern for other civic services. Point at [ROADMAP.md](ROADMAP.md) for what is next.
7. **Close (15s).** “Ubuntu: I am because we are. Every resident deserves an answer in their own language.”

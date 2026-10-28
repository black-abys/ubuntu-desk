# Ubuntu Desk — 3-minute judging script

Speak this. Do not add numbers about municipalities that are not in the repo. The demo account, the R1,633.85 figure, and the simulated labels are the facts.

## Hook (15 seconds)

A resident opens an electricity bill that jumped from about R1,200 to R3,107 and cannot see why. Ubuntu Desk lets them ask in their own language, watch the calculation, read the cited clause, and confirm a dispute. Nothing is stored until they say so.

## The problem (20 seconds)

Disputing that bill today means a queue and an explanation in English. Estimated readings are the case this demo is built around. The resident should see the working, not a black-box answer.

## Live demo (90 seconds)

The app is already running at `http://localhost:3000`.

1. Open `http://localhost:3000/?autorun=1&lang=zu&fast=1`.
   isiZulu runs on its own and stops on the confirm checkbox. Point at **R1,633.85** and the dispute draft that cites **§14.3**. The checkbox is still empty. Nothing has been submitted.
2. Open `http://localhost:3000/?autorun=1&lang=af&fast=1`, then `http://localhost:3000/?autorun=1&lang=xh&fast=1`.
   Same finding, in Afrikaans and isiXhosa. Say out loud: these eight languages are machine-translated and the screen says they are pending native-speaker review. English, isiZulu, and Sesotho are the reviewed demo scripts. None of them are certified translations.
3. Open `http://localhost:3000/?workspace=scan&sample=1`.
   The sample bill loads. OCR is simulated. The banner says so.
4. Back on the resident screen, type `hello` and send it.
   The desk explains what it can help with. It does not invent a billing finding.
5. Change the account number to anything other than `JHB-4471-0093` and ask about the bill again.
   The account is not found. The only household in the simulated ledger is that demo account.
6. If time remains, return to the isiZulu run, tick the box, and submit.
   The case id starts with `DEMO-DSP-` and the status reads **Submitted (simulated)**. Open `http://localhost:3000/?workspace=dashboard` and show the same label on the queue.

## OpenEdge and the AI (30 seconds)

Progress OpenEdge is the system of record we are building toward: account, readings, and the dispute. Progress Agentic RAG is the knowledge layer we are building toward: the by-law clause and a retrieval score. Both sit behind adapters in `src/lib/adapters`. Today those adapters are simulated. The real folders are scaffolds. Unset environment variables keep the demo on the mocks, and the header says **simulated**. The billing check itself is real code. The same inputs always produce R1,633.85 on this account. A model does not invent the balance.

## Roadmap (20 seconds)

Version 2.0, in [ROADMAP.md](ROADMAP.md), is a resident who can bring a bill or a photo, get an evidence-backed explanation, and track a dispute. The next product work is a tested OpenEdge connection, a tested knowledge box, OCR that reads a real image, and native-speaker review of every language. The near-term competition plan is [PLAN.md](PLAN.md).

## Close (10 seconds)

Eleven languages. The maths on the screen. A person confirms before anything is written. And every simulated part is labelled, because a demo that pretends to be a municipality is not a demo we will ship.

## Questions judges may ask

**Is this connected to a live municipality?**
No. Account lookup, policy answers, OCR, and dispute submission are simulated. The UI says so. Collection is not suspended. Nothing is filed.

**Is R1,633.85 a model guess?**
No. `src/lib/billing.ts` computes it from the simulated September estimated reading, the 20% cap, and the demo rate of R3.05 per kWh. The test locks that figure.

**Are the translations certified?**
No. isiZulu and Sesotho are reviewed demo scripts, not certified translations. The other eight are static machine translations, labelled pending native-speaker review. There is no live translation API.

**What happens if I type hello, or a wrong account number?**
Hello gets a help reply and no finding. Any account other than `JHB-4471-0093` is not found. The server also rejects a dispute without confirmation, or an amount that is zero, negative, or above the calculated overcharge.

**Where does OpenEdge fit?**
`OpenEdgeClient` is the boundary: get account, create dispute, update dispute, list disputes. `mock/openedge.ts` implements it today. `real/openedge.ts` is a scaffold and is not a tested PASOE connection. Switching it on does not make this a live municipal system.

**Can staff just move a case to resolved?**
On the dashboard, the next status is a simulated staff action. It does not write to a municipality.

**What about speech?**
The browser’s Web Speech API. If that browser has no voice or recogniser for the language, playback uses an English voice and the resident can type. A speech-recognition score is not a retrieval score, and neither score is a legal conclusion.

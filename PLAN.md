# Ubuntu Desk: build plan (16–29 Oct 2026)
The hard deadline is **28 Oct, 14:00 SAST, submitted on GitHub**. Late entries are not accepted.

| Date | Goal |
|---|---|
| Thu 15 Oct | **Register** (closes today). Join the Discord. |
| Fri 16 Oct | Read the starter kit. Set up OpenEdge (PDSOE/PASOE) locally. List the PASOE REST endpoints we need. |
| Sat 17 Oct | Draft the OpenEdge schema: `Account`, `Reading`, `Tariff`, `Dispute`. Write seed data. |
| Sun 18 Oct | Collect the RAG source documents (tariff by-law, customer charter, FAQs; public PDFs). Polish the mock demo. |
| Mon 19 Oct | **Kick-off in Midrand.** Map Ubuntu Desk to an official use case and adjust the story if needed. Form or confirm the team. Ask the Progress team about access to OpenEdge and Agentic RAG. **Start the Agentic RAG trial** (14 days, which covers the 29th). |
| Tue 20 Oct | Expose the PASOE REST services. Implement `real/openedge.ts`. Test reading the account and writing a dispute. |
| Wed 21 Oct | Create the Knowledge Box and ingest the documents. Implement `real/rag.ts`, mapping citations and REMi scores. |
| Thu 22 Oct | Agent: replace the rule-based reasoning with LLM tool calling (tools are the OpenEdge client and the RAG client). |
| Fri 23 Oct | Languages: test isiZulu and Sesotho speech-to-text, text-to-speech and translation. Add a text-only fallback. |
| Sat 24 Oct | Add a second scenario (a water bill, or a correct bill to show the agent says "no error"). Handle errors. |
| Sun 25 Oct | UI polish (design skill), accessibility pass, dashboard charts. |
| Mon 26 Oct | Finish the README, architecture diagram and screenshots. Record a backup demo video. |
| Tue 27 Oct | Freeze features. Make the pitch deck and rehearse three times with a timer. |
| **Wed 28 Oct** | Final check, then **push before 12:00** (two hours of buffer before 14:00). |
| Thu 29 Oct | Present at AIE. Bring the offline mock mode and the recorded video as a fallback. |

## Pitch outline (~5 min)
1. **Hook (30s):** "Gogo in Soweto got a R3,107 electricity bill. She normally pays R1,200." Show a photo of a queue.
2. **Problem (30s):** estimated readings, language barriers, nobody knows their rights, long queues.
3. **Live demo (2 min):** a voice note in isiZulu, then the agent's reasoning steps, a cited clause (§14.3) with a 97% groundedness score, an overcharge of R1,633, a dispute written to OpenEdge, and the spoken isiZulu reply. The dashboard updates.
4. **How it works (45s):** the architecture diagram. OpenEdge is the system of record and the agent both reads and writes it. Agentic RAG provides cited answers with REMi scores. The adapters are swappable.
5. **Trust (20s):** every answer is cited and scored, and every action is logged in OpenEdge.
6. **Impact and scale (30s):** around 260 municipalities, 11 official languages, the same pattern works for SASSA, clinics and schools.
7. **Close (15s):** "Ubuntu: I am because we are. Every resident deserves an answer in their own language."

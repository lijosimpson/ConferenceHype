# ASCO 2026 Core Index

`core-index.json` is the low-cost backbone for ASCO Hype.

It is generated from:

- `C:\Users\lijos\OneDrive\Desktop\ASCO2026\ASCO_2026_Annual_Meeting_Sessions.xlsx`
- `C:\Users\lijos\Downloads\meeting_335_abstracts.csv`

The channel should not send either raw file to the LLM. The index stores compact, pre-cleaned session and abstract records. The main broadcast spine is generated every 20 minutes without using Grok or any other LLM.

Cost rule:

- Use the ASCO index for the recurring no-token upcoming-events spine every 20 minutes.
- Use the 75-minute recap briefing only for broader "what happened / what is next" blocks.
- Use RSS, X, Instagram-style social signals, OncLive, STAT News, The ASCO Post, exhibitor posts, and `#ASCOHype` as interruption programming.
- Use full abstracts only when needed for a human-selected deep dive.
- Treat abstracts as conference material and scheduled presentations, not verified medical guidance.

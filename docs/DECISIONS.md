# Decisions log

Shared record of decisions so any assistant or contributor works from the same assumptions. Newest first.

## 2026-11-01

- **Repository:** `Padddes/webcooking` on GitHub is the source repository for paddes.lu (empty at start; the old meal planner is not reused or recreated).
- **Repository visibility: public (owner's choice).** Consequence: unpublished drafts saved through the CMS (branches / pull requests) and branch preview deployments are publicly readable. Secrets are never committed; OAuth secrets live only in server-side configuration.
- **Build tooling: open.** The session environment used to start the project cannot reach the npm registry. Pending owner decision between (a) the brief's Astro + React + Pagefind stack, built where npm is available, and (b) a dependency-free Node build.

## Confirmed requirements (from the brief)

- paddes.lu is the main hub; `/poe` is for Path of Exile 1 explanations and tools.
- Map regex builder inspired by poe.re, with the two-column unwanted/wanted layout.
- Admin area with browser-based page editing.
- Hosting as free as reasonably possible.

## Proposals (apply unless the owner changes them)

- Dark charcoal, ivory text, antique gold accents.
- English first, structure ready for German.
- Map regex first; flask and vendor tools later.
- Presets stored on the visitor's device only; no visitor accounts.
- No comments, payments, live pricing, chatbot or accounts in the first release.

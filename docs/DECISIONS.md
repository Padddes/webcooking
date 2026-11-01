# Decisions log

Shared record of decisions so any assistant or contributor works from the same assumptions. Newest first.

## 2026-11-01

- **Repository:** `Padddes/webcooking` on GitHub is the source repository for paddes.lu (empty at start; the old meal planner is not reused or recreated).
- **Repository visibility: public (owner's choice).** Consequence: unpublished drafts saved through the CMS (branches / pull requests) and branch preview deployments are publicly readable. Secrets are never committed; OAuth secrets live only in server-side configuration.
- **Build tooling: dependency-free Node build (owner's choice)** instead of the brief's Astro + React + Pagefind. Reason: the environment used to develop the site cannot reach the npm registry. Node >= 22.18 runs TypeScript directly; browser code is type-stripped, not bundled. Interactive tools will use plain TypeScript instead of React, search will be a custom static index, and Decap CMS will be loaded from a script URL. Trade-offs are listed in `ARCHITECTURE.md`.
- **Draft privacy model:** because the repository is public, CMS drafts are public too. Accepted by the owner.
- **Fonts:** system font stacks only (no font downloads), for speed, privacy and zero cost.
- **Navigation:** the PoE sub-items (Learn, Tools, Glossary) are always visible in the sidebar so they're easy to find.

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

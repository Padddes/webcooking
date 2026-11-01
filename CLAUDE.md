# Instructions for assistants working on paddes.lu

Read `docs/DECISIONS.md` and `docs/ARCHITECTURE.md` before changing anything.

## Ground rules

- **No npm dependencies.** The build uses only Node's standard library (Node >= 22.18 runs `.ts` directly). Do not add packages without the owner's agreement and a note in `docs/DECISIONS.md`.
- TypeScript must use **erasable syntax only** (no `enum`, `namespace`, parameter properties). Node strips types; nothing type-checks the code, so keep types simple and honest.
- Content lives in `src/content/` as JSON and is validated in `build/content.ts`. Every new content field needs a schema entry; the build must fail on invalid content.
- All HTML goes through `html\`\`` from `build/lib/html.ts`, which escapes by default. Use `raw()` only for markup that lives in this repository.
- Do not publish invented biography, statistics or game mechanics. Unverified guide material stays unpublished.
- Never commit secrets. The repository is **public**: drafts and branches are visible to anyone.
- Path of Exile is a trademark of Grinding Gear Games; never imply endorsement.

## Commands

- `npm run build` – build into `dist/`
- `npm test` – build + tests (routes, links, anchors, page basics, escaping, schemas)
- `npm run dev` – build and serve at http://localhost:4321/

Keep the project buildable and the tests green at every commit. Record decisions in `docs/DECISIONS.md`.

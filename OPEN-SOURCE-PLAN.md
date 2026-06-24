# Open-Source Promotion Plan — @aryrabelo/free-text-core

Analyzed: 2026-06-24
Package version: 0.1.0
Source: `src/` (8 modules) · Tests: `tests/` (10 files)

---

## 1. README Audit

The current README is **7 lines and 291 bytes**. It is a stub that documents almost nothing. Below is an itemized completeness check against what a public npm package is expected to have.

| Element | Present? | Notes |
|---|---|---|
| Package name + 1-line description | ✓ | Good |
| Badges (npm version, license, CI) | ✗ | None |
| Install instructions | ✗ | Absent |
| Runtime requirements | ✗ | Bun-only is undocumented in README |
| "What does this do?" narrative | ✗ | One sentence, no context |
| Architecture / module overview | ✗ | None |
| Usage examples (code snippets) | ✗ | Zero code in README |
| API reference table | ✗ | None |
| Ecosystem / consumer packages | ~ | Named inline but no links |
| Contributing guide | ✗ | None |
| CHANGELOG link | ✗ | File exists but not linked |
| Demo screenshot or GIF | ✗ | None |
| License section | ~ | "MIT, Ary Rabelo." — correct but minimal |

**Score: 2 / 13 elements present.**

---

## 2. npm Package Audit

### Critical gaps

**a) TypeScript source exports — no compiled dist**
`package.json` `exports` maps to `./src/index.ts` (raw TypeScript). This means:
- Consumers using npm with Node.js or any non-Bun runtime get a broken package at runtime.
- Only Bun (which transpiles `.ts` natively) or a bundler pointed at the source works.
- This **must** be disclosed prominently in the README or the package ships broken for the majority of npm users.
- Recommended fix: add a `build` script that emits `.js` + `.d.ts` to `dist/`, update `exports` and `main` to point there, and exclude `src/**/*.ts` from the published files (or keep source alongside for IDE jump-to-source).

**b) Missing `publishConfig`**
Scoped npm packages default to restricted access. Publishing without `publishConfig: { "access": "public" }` will silently publish as private (or fail) on npm.

**c) No CI / no CI badge**
No `.github/workflows/` directory exists. There is no automated test run on push/PR, meaning no CI badge is possible, and breakage is not caught before publish.

### Minor gaps

| Item | Status | Fix |
|---|---|---|
| `sideEffects: false` | Missing | Add to package.json — enables tree-shaking |
| Keywords | Thin (5 keywords) | Expand (see §3 below) |
| `engines.node` | Not set | Either add after adding dist, or keep Bun-only and document it |
| CHANGELOG | Minimal | Acceptable for 0.1.0; add entry per release |
| LICENSE | ✓ MIT, 2026 | Good |
| `repository.url` | ✓ | Good |
| `homepage` | ✓ | Good |
| `bugs.url` | ✓ | Good |

---

## 3. Concrete Improvement Recommendations

### 3.1 README — rewrite from scratch

Replace the 7-line stub with a structured README. Suggested section order:

```
# @aryrabelo/free-text-core

<badges row>

One-paragraph "what and why."

## Install

## Requirements

## Modules

## Usage examples (one per module)

## API reference

## Ecosystem

## Contributing

## License
```

**Badges row** (top of README, after the `# h1`):
```md
[![npm](https://img.shields.io/npm/v/@aryrabelo/free-text-core)](https://www.npmjs.com/package/@aryrabelo/free-text-core)
[![license](https://img.shields.io/npm/l/@aryrabelo/free-text-core)](./LICENSE)
[![CI](https://github.com/aryrabelo/free-text-core/actions/workflows/ci.yml/badge.svg)](https://github.com/aryrabelo/free-text-core/actions/workflows/ci.yml)
[![bun](https://img.shields.io/badge/runtime-bun-f9f1e1)](https://bun.sh)
```

**"What and why" paragraph** — expand the current single sentence to explain:
- The problem: AI coding agents (OMP, Claude Code) need persistent per-session notes + a markdown prompt queue that outlives context resets.
- The solution: runtime-agnostic pure logic (path scheme, persistence, queue parsing, widget rendering, stats line) so multiple plugins can share the same behavior without diverging.
- The constraint: pure Node/Bun FS + path APIs, no framework, no UI binding, easily testable.

**Modules table:**

| Module | What it provides |
|---|---|
| `paths` | Derive safe filesystem paths for notes, history, config, and the `current.md` session pointer |
| `store` | Async read / write / append-history / cross-session list, plus a debounced coalescing writer |
| `queue` | Parse and mutate a markdown checkbox prompt queue: find head, mark inflight, complete, append |
| `widget` | Render the notes widget as a styled string array (OMP HUD-style) |
| `stats` | Context bar + model + +adds/-dels + elapsed as a plain or styled string |
| `config` | Parse and validate `config.json` shortcut overrides; humanize key strings |
| `editor` | Decide whether an editor close should save, discard, or ask for confirmation |

**Usage examples — priority code snippets:**

1. **Queue round-trip** (the core use case):
```ts
import { findHead, markInflight, completeInflight, appendTask } from "@aryrabelo/free-text-core";

let note = "- [ ] Refactor auth module\n- [ ] Write tests";
const head = findHead(note);
// { kind: "prompt", line: 0, text: "Refactor auth module" }

note = markInflight(note, head.line);
// "- [>] Refactor auth module\n- [ ] Write tests"

note = completeInflight(note);
// "- [x] Refactor auth module\n- [ ] Write tests"
```

2. **Persist a note with debounced saves:**
```ts
import { notePathFor, resolveLocation, saveNote, createDebouncedSaver } from "@aryrabelo/free-text-core";

const loc = resolveLocation({ repo: "my-repo", branch: "main", sessionId: "abc123" });
const path = notePathFor(loc);
const saver = createDebouncedSaver((content) => saveNote(path, content));

saver.schedule("# Session notes\n- [ ] First task");
// coalesces rapid updates; one write per 400ms window
await saver.flush();
```

3. **Stats line:**
```ts
import { renderStatsLine } from "@aryrabelo/free-text-core";

const line = renderStatsLine({
  modelName: "claude-sonnet-4-5",
  contextRemainingPct: 42,
  linesAdded: 120,
  linesRemoved: 30,
  durationMs: 185000,
});
// "▓▓▓▓▓▓░░░░ 59% | claude-sonnet-4-5 | +120/-30 | 3m 05s"
```

4. **Append a structured queue from a plan:**
```ts
import { appendQueue, type QueueStep } from "@aryrabelo/free-text-core";

const steps: QueueStep[] = [
  { prompt: "Set up CI", details: ["Add .github/workflows/ci.yml"] },
  { prompt: "Write API docs", barrierAfter: true },
  { prompt: "Publish to npm" },
];
const updated = appendQueue("# Today\n", steps);
```

### 3.2 Requirements section

Add an explicit **Requirements** section immediately after the install block:

```md
## Requirements

- **Bun ≥ 1.0.0** — the package ships TypeScript source (`src/*.ts`). Bun transpiles it natively at import time. Node.js consumers need a bundler (esbuild, Vite, tsup) configured to handle `.ts` imports, or wait for a compiled `dist/` release.
```

Alternatively: add a build step (tsup / bun build) and emit a `dist/` so Node.js consumers get `.js` + `.d.ts` out of the box. This broadens the audience significantly.

### 3.3 API reference

Add a collapsible `<details>` or a flat table per module listing every exported symbol, its signature, and one-line description. The TSDoc comments already in source are the source of truth — the README just needs a rendered summary. Alternatively, configure typedoc to auto-generate and link from the README.

### 3.4 Demo GIF

Recommended content for a terminal demo GIF (record with `vhs` or `terminalizer`):

1. Show a raw note file with mixed plain bullets and checkboxes.
2. Call `normalizeQueue` — plain bullets convert to `- [ ] ...`.
3. Call `findHead` — returns the first pending item.
4. Call `markInflight` — line flips to `- [>] ...`.
5. Call `completeInflight` — flips to `- [x] ...`.
6. Show `renderWidgetLines` output in a terminal frame.

Save to `docs/demo.gif` and embed in the README with:
```md
![prompt-queue demo](docs/demo.gif)
```

### 3.5 npm keywords — expand

Current: `["free-text", "notes", "scratchpad", "statusline", "prompt-queue"]`

Recommended (add these):
```json
"keywords": [
  "free-text",
  "notes",
  "scratchpad",
  "statusline",
  "prompt-queue",
  "session-notes",
  "ai-agent",
  "claude",
  "claude-code",
  "oh-my-pi",
  "omp",
  "markdown",
  "checkbox",
  "widget",
  "terminal",
  "plugin"
]
```

Rationale: "claude", "claude-code", "ai-agent", and "oh-my-pi" / "omp" are the search terms a potential consumer would use. "session-notes" and "markdown" are generic enough to surface in broad searches.

### 3.6 GitHub Actions CI

Add `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: latest }
      - run: bun install
      - run: bun test
      - run: bun run typecheck
      - run: bun run lint
```

This enables the CI badge and catches regressions before publish.

### 3.7 Contributing guide

Add `CONTRIBUTING.md` (or a `## Contributing` section in the README) covering:
- How to clone + install (`git clone` + `bun install`)
- How to run tests (`bun test`)
- How to run type check (`bun run typecheck`)
- How to run lint/format (`bun run lint` / `bun run format`)
- PR expectations (test coverage for new behavior, TSDoc on exports)

### 3.8 package.json additions

```json
"publishConfig": { "access": "public" },
"sideEffects": false
```

### 3.9 Ecosystem section

Add a section that links to the consuming packages:

```md
## Ecosystem

| Package | Description |
|---|---|
| [`@aryrabelo/omp-free-text`](https://github.com/aryrabelo/omp-free-text) | Oh My Pi plugin — session notes + prompt queue in the OMP HUD |
| [`@aryrabelo/claude-free-text`](https://github.com/aryrabelo/claude-free-text) | Claude Code plugin — same feature set for Claude Code sessions |
```

---

## 4. Priority Order

| Priority | Change | Effort |
|---|---|---|
| P0 | README: add install + requirements (Bun caveat) | 15 min |
| P0 | README: add at least 2 usage examples | 30 min |
| P0 | `package.json`: add `publishConfig: { access: "public" }` | 2 min |
| P1 | GitHub Actions CI workflow | 20 min |
| P1 | README: module overview table + API surface list | 45 min |
| P1 | Expand npm keywords | 5 min |
| P1 | `package.json`: add `sideEffects: false` | 2 min |
| P2 | CONTRIBUTING.md | 30 min |
| P2 | Ecosystem section + links | 15 min |
| P2 | Consider tsup/bun build → dist/ for Node.js compat | 2–4 hours |
| P3 | Demo GIF | 1–2 hours |
| P3 | Auto-generated typedoc API reference | 1 hour |

---

## 5. LICENSE Check

`LICENSE` is **MIT, 2026, Ary Rabelo** — present and correct. No action needed beyond ensuring `"license": "MIT"` in `package.json` stays in sync (it does).

---

## Summary

The package has solid internals: well-typed, TSDoc'd, thoroughly tested (10 test files covering all 8 modules), clean module separation, and a sensible file layout. The gap is entirely in its public face. The README is a stub that gives a potential adopter no reason to trust or use the package. Fixing the README + adding CI would take less than 2 hours and move this from "looks abandoned" to "looks production-ready."

The one structural concern is the TypeScript-source-only `exports` — this needs either a prominent Bun requirement callout or a `dist/` build step before this package can claim to be a general-purpose npm library.

# @aryrabelo/free-text-core

[![npm](https://img.shields.io/npm/v/@aryrabelo/free-text-core)](https://www.npmjs.com/package/@aryrabelo/free-text-core)
[![license](https://img.shields.io/npm/l/@aryrabelo/free-text-core)](./LICENSE)
[![CI](https://github.com/aryrabelo/free-text-core/actions/workflows/ci.yml/badge.svg)](https://github.com/aryrabelo/free-text-core/actions/workflows/ci.yml)
[![bun](https://img.shields.io/badge/runtime-bun-%23f9f1e1)](https://bun.sh)

Runtime-agnostic pure logic for AI agent session notes — path scheme, persistence, markdown prompt-queue parsing, widget rendering, and a stats line. Shared between [`@aryrabelo/omp-free-text`](https://github.com/aryrabelo/omp-free-text) (Oh My Pi) and [`@aryrabelo/claude-free-text`](https://github.com/aryrabelo/claude-free-text) (Claude Code) so both plugins stay in sync without duplicating behavior.

## Requirements

**Bun ≥ 1.0.0** — the package ships TypeScript source (`src/*.ts`). Bun transpiles it natively at import time with no extra config. Node.js consumers need a bundler (esbuild, Vite, tsup) configured to handle `.ts` source imports.

## Install

```sh
bun add @aryrabelo/free-text-core
```

## Modules

| Module | What it provides |
|---|---|
| `paths` | Derive safe filesystem paths for notes, history, config, and the `current.md` session pointer |
| `store` | Async read / write / append-history / cross-session list, plus a coalescing debounced writer |
| `queue` | Parse and mutate a markdown checkbox prompt queue: find head, mark inflight, complete, append |
| `widget` | Render the notes widget as a styled string array (OMP HUD-style, with continuation lines) |
| `stats` | Context bar + model + +adds/-dels + elapsed as a plain or injected-style string |
| `config` | Parse and validate `config.json` shortcut overrides; humanize key strings for display |
| `editor` | Decide whether an editor close should save, discard, or ask — no silent data loss |

All modules are re-exported from the package root:

```ts
import { findHead, markInflight, notePathFor, renderStatsLine } from "@aryrabelo/free-text-core";
```

## Usage

### Prompt queue — the core use case

```ts
import {
  appendTask,
  findHead,
  markInflight,
  completeInflight,
  appendQueue,
  type QueueStep,
} from "@aryrabelo/free-text-core";

// Start with a plain note — loose bullets are normalized automatically
let note = "- Refactor auth module\n- Write tests";

// Append a structured plan
const steps: QueueStep[] = [
  { prompt: "Set up CI", details: ["Add .github/workflows/ci.yml"] },
  { prompt: "Review PR", barrierAfter: true },   // pauses queue until human clears barrier
  { prompt: "Ship to npm" },
];
note = appendQueue(note, steps);

// Find and dispatch the first pending item
const head = findHead(note);
// { kind: "prompt", line: 0, text: "Refactor auth module" }

note = markInflight(note, head.line);
// "- [>] Refactor auth module\n..."

// After the agent completes it:
note = completeInflight(note);
// "- [x] Refactor auth module\n..."
```

### Persist a note with debounced saves

```ts
import {
  resolveLocation,
  notePathFor,
  loadNote,
  saveNote,
  createDebouncedSaver,
} from "@aryrabelo/free-text-core";

const loc = resolveLocation({ repo: "my-repo", branch: "main", sessionId: "abc123" });
const path = notePathFor(loc);              // ~/.free-text/my-repo/main/abc123.md

const content = await loadNote(path);       // "" when file doesn't exist yet

const saver = createDebouncedSaver((c) => saveNote(path, c));
saver.schedule(content + "\n- [ ] New task");  // coalesces rapid updates
await saver.flush();
```

### Stats line

```ts
import { renderStatsLine } from "@aryrabelo/free-text-core";

const line = renderStatsLine({
  modelName: "claude-sonnet-4-5",
  contextRemainingPct: 42,
  linesAdded: 120,
  linesRemoved: 30,
  durationMs: 185_000,
});
// "▓▓▓▓▓▓░░░░ 59% | claude-sonnet-4-5 | +120/-30 | 3m 05s"
```

### Widget rendering

```ts
import { renderWidgetLines, PLAIN_STYLE } from "@aryrabelo/free-text-core";

const note = "- [x] Done task\n- [>] In-flight task\n- [ ] Pending task";
const lines = renderWidgetLines(note, { maxLines: 6, style: PLAIN_STYLE });
// ["  └ ✓ Done task", "  └ ▸ In-flight task", "  └ ☐ Pending task", "(Ctrl+N)"]
```

## Path scheme

Notes live under `~/.free-text/<repo>/<branch>/<sessionId>.md`. The package reads the legacy `~/.omp-free-text/` path for back-compat when the new path doesn't exist yet.

```
~/.free-text/
  my-repo/
    main/
      current.md          ← pointer to the active session id
      abc123.md           ← session note
      abc123.history.md   ← append-only history log
```

## API

Full TSDoc on every export. Key symbols:

**paths** — `resolveLocation`, `notePathFor`, `historyPathFor`, `sessionsDirFor`, `configPathFor`, `legacyNotePathFor`, `currentPointerPathFor`

**store** — `loadNote`, `loadConfigText`, `saveNote`, `listNotes`, `appendHistory`, `createDebouncedSaver`, `writeCurrentPointer`, `readCurrentPointer`, `loadNoteWithFallback`

**queue** — `parseTaskLine`, `findHead`, `markInflight`, `completeInflight`, `normalizeQueue`, `appendTask`, `appendQueue`, `removeBarrier`

**stats** — `computeContext`, `contextLevel`, `formatDuration`, `buildContextBar`, `renderStatsLine`

**widget** — `renderWidgetLines`, `PLAIN_STYLE`, `SHORTCUT_HINT`, `EMPTY_HINT`

**config** — `parseShortcutConfig`, `humanizeKey`, `queueHint`

**editor** — `resolveCloseAction`

## Ecosystem

| Package | Description |
|---|---|
| [`@aryrabelo/omp-free-text`](https://github.com/aryrabelo/omp-free-text) | Oh My Pi plugin — session notes + prompt queue in the OMP HUD |
| [`@aryrabelo/claude-free-text`](https://github.com/aryrabelo/claude-free-text) | Claude Code plugin — same feature set for Claude Code sessions |

## Contributing

```sh
git clone https://github.com/aryrabelo/free-text-core.git
cd free-text-core
bun install

bun test          # run tests
bun run typecheck # type check
bun run lint      # lint (biome)
bun run format    # auto-fix formatting
```

PRs welcome. Please include tests for new behavior and TSDoc on any new exports.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT — [Ary Rabelo](https://github.com/aryrabelo)

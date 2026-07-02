import { expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	loadNoteWithFallback,
	readCurrentPointer,
	writeCurrentPointer,
} from "../src/store";

test("current pointer round-trips the session id", async () => {
	const dir = await mkdtemp(join(tmpdir(), "ft-"));
	await writeCurrentPointer(dir, "sess-42");
	expect(await readCurrentPointer(dir)).toBe("sess-42");
});

test("readCurrentPointer returns '' when missing", async () => {
	const dir = await mkdtemp(join(tmpdir(), "ft-"));
	expect(await readCurrentPointer(dir)).toBe("");
});

test("loadNoteWithFallback prefers new path, falls back to legacy", async () => {
	const dir = await mkdtemp(join(tmpdir(), "ft-"));
	const legacy = join(dir, "legacy.md");
	await writeFile(legacy, "old note", "utf8");
	expect(await loadNoteWithFallback(join(dir, "new.md"), [legacy])).toBe(
		"old note",
	);
	await writeFile(join(dir, "new.md"), "new note", "utf8");
	expect(await loadNoteWithFallback(join(dir, "new.md"), [legacy])).toBe(
		"new note",
	);
});

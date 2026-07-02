import { expect, test } from "bun:test";
import * as core from "../src/index";

test("public surface is exported", () => {
	for (const name of [
		"resolveLocation",
		"notePathFor",
		"legacyNotePathsFor",
		"legacySessionsDirsFor",
		"legacyConfigPathsFor",
		"currentPointerPathFor",
		"loadNote",
		"saveNote",
		"listNotes",
		"appendHistory",
		"createDebouncedSaver",
		"writeCurrentPointer",
		"readCurrentPointer",
		"loadNoteWithFallback",
		"renderWidgetLines",
		"parseTaskLine",
		"normalizeQueue",
		"renderStatsLine",
		"computeContext",
		"formatDuration",
	]) {
		expect(typeof (core as Record<string, unknown>)[name]).not.toBe(
			"undefined",
		);
	}
});

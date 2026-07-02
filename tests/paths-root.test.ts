import { expect, test } from "bun:test";
import {
	currentPointerPathFor,
	LEGACY_ROOT_DIR_NAMES,
	legacyConfigPathsFor,
	legacyNotePathsFor,
	legacySessionsDirsFor,
	notePathFor,
	ROOT_DIR_NAME,
	resolveLocation,
} from "../src/paths";

const home = "/home/u";
const loc = resolveLocation({
	cwd: "/x/repo",
	repoToplevel: "/x/repo",
	branch: "main",
	sessionId: "s1",
});

test("new root is .planqueue", () => {
	expect(ROOT_DIR_NAME).toBe(".planqueue");
	expect(notePathFor(loc, home)).toBe("/home/u/.planqueue/repo/main/s1.md");
});

test("legacy roots are .free-text then .omp-free-text (newest legacy first)", () => {
	expect(LEGACY_ROOT_DIR_NAMES).toEqual([".free-text", ".omp-free-text"]);
});

test("legacyNotePathsFor yields one read-fallback path per legacy root, in order", () => {
	expect(legacyNotePathsFor(loc, home)).toEqual([
		"/home/u/.free-text/repo/main/s1.md",
		"/home/u/.omp-free-text/repo/main/s1.md",
	]);
});

test("legacySessionsDirsFor yields one dir per legacy root, in order", () => {
	expect(legacySessionsDirsFor(loc, home)).toEqual([
		"/home/u/.free-text/repo/main",
		"/home/u/.omp-free-text/repo/main",
	]);
});

test("legacyConfigPathsFor yields one config path per legacy root, in order", () => {
	expect(legacyConfigPathsFor(home)).toEqual([
		"/home/u/.free-text/config.json",
		"/home/u/.omp-free-text/config.json",
	]);
});

test("current pointer lives per repo/branch under the new root", () => {
	expect(currentPointerPathFor(loc, home)).toBe(
		"/home/u/.planqueue/repo/main/current.md",
	);
});

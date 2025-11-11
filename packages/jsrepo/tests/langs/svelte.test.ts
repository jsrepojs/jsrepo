import fs from "node:fs";
import path from "pathe";
import { describe, expect, it, vi } from "vitest";
import { svelte } from "@/langs/svelte";

const CWD = path.join(__dirname, "../fixtures/langs/svelte");

describe("svelte", () => {
	it("should resolve dependencies", async () => {
		const warn = vi.fn();
		const code = fs.readFileSync(path.join(CWD, "page.svelte"), "utf-8");
		const result = await svelte().resolveDependencies(code, {
			fileName: "page.svelte",
			cwd: CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe("../js/logger");
		expect(result.dependencies[0]?.name).toBe("svelte");
		expect(result.dependencies[0]?.version).toBe(undefined);
	});

	it("should exclude excluded dependencies", async () => {
		const warn = vi.fn();
		const code = fs.readFileSync(path.join(CWD, "page.svelte"), "utf-8");
		const result = await svelte().resolveDependencies(code, {
			fileName: "page.svelte",
			cwd: CWD,
			excludeDeps: ["svelte"],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe("../js/logger");
		expect(result.dependencies[0]?.name).toBe(undefined);
		expect(result.dependencies[0]?.version).toBe(undefined);
	});
});

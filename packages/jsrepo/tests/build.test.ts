import path from "pathe";
import { assert, describe, expect, it } from "vitest";
import { loadConfigSearch } from "@/api";
import { forEachRegistry } from "@/commands/utils";
import { buildRegistry, ResolvedItem } from "@/utils/build";

const cwd = path.join(__dirname, "./fixtures/build");

describe("buildRegistry", () => {
	it("should build a registry", async () => {
		const config = await loadConfigSearch({ cwd, promptForContinueIfNull: false });
		if (config === null) throw new Error("Config not found");

		const results = await forEachRegistry(
			config.config,
			async (registry) => {
				return await buildRegistry(registry, { options: { cwd }, config: config.config });
			},
			{ cwd }
		);

		const firstRegistryResult = results[0];
		assert(firstRegistryResult !== undefined);
		const firstRegistry = firstRegistryResult.match(
			(v) => v,
			(e) => {
				throw e;
			}
		);

		// expect all metadata to be present and correct
		expect(firstRegistry.name).toBe("@jsrepo/test");
		expect(firstRegistry.authors).toStrictEqual(["Aidan Bleser"]);
		expect(firstRegistry.bugs).toBe("https://github.com/jsrepojs/jsrepo/issues");
		expect(firstRegistry.description).toBe("A test registry");
		expect(firstRegistry.homepage).toBe("https://github.com/jsrepojs/jsrepo");
		expect(firstRegistry.repository).toBe("https://github.com/jsrepojs/jsrepo");
		expect(firstRegistry.tags).toStrictEqual(["test", "registry"]);
		expect(firstRegistry.version).toBe("0.0.1");
		expect(firstRegistry.defaultPaths).toStrictEqual({
			utils: "./src/utils",
		});

		expect(firstRegistry.items).toStrictEqual([
			{
				name: "math",
				title: undefined,
				type: "utils",
				description: undefined,
				basePath: "src/utils/math",
				files: [
					{
						target: undefined,
						path: "src/utils/math/add.ts",
						content: "export function add(a: number, b: number) {\n\treturn a + b;\n}\n",
						type: undefined,
						_imports_: [],
						registryDependencies: [],
						dependencies: [],
						devDependencies: [],
					},
					{
						target: undefined,
						path: "src/utils/math/answer-format.ts",
						content:
							"import color from 'chalk';\n" +
							"import { print } from '../stdout';\n" +
							"\n" +
							"export function answerFormat(answer: number) {\n" +
							"\treturn print(color.green(`The answer is ${answer}`));\n" +
							"}\n",
						type: undefined,
						_imports_: [
							{
								import: "../stdout",
								item: "stdout",
								meta: { filePathRelativeToItem: "stdout.ts" },
							},
						],
						registryDependencies: [],
						dependencies: [],
						devDependencies: [],
					},
					{
						target: undefined,
						path: "src/utils/math/add.test.ts",
						content:
							'import { describe, expect, it } from "vitest";\n' +
							'import { add } from "./add";\n' +
							"\n" +
							'describe("add", () => {\n' +
							'\tit("should add two numbers", () => {\n' +
							"\t\texpect(add(1, 2)).toBe(3);\n" +
							"\t});\n" +
							"});",
						type: "registry:test",
						_imports_: [],
						registryDependencies: [],
						dependencies: [{ ecosystem: "js", name: "vitest", version: undefined }],
						devDependencies: [],
					},
				],
				registryDependencies: ["stdout"],
				dependencies: [{ ecosystem: "js", name: "chalk", version: "^5.6.2" }],
				devDependencies: [],
				add: "when-added",
				envVars: undefined,
			},
			{
				name: "stdout",
				title: undefined,
				type: "utils",
				description: undefined,
				basePath: "src/utils",
				files: [
					{
						target: undefined,
						path: "src/utils/stdout.ts",
						content: "export function print(msg: string) {\n\tconsole.log(msg);\n}\n",
						type: undefined,
						_imports_: [],
						registryDependencies: [],
						dependencies: [],
						devDependencies: [],
					},
				],
				registryDependencies: [],
				dependencies: [],
				devDependencies: [],
				add: "when-added",
				envVars: undefined,
			},
			{
				name: "shiki",
				title: undefined,
				type: "utils",
				description: undefined,
				basePath: "src/utils",
				files: [
					{
						target: undefined,
						path: "src/utils/shiki.ts",
						content:
							'import { createHighlighterCore } from "shiki/core";\n' +
							'import { createJavaScriptRegexEngine } from "shiki/engine/javascript";\n' +
							"\n" +
							"export const highlighter = await createHighlighterCore({\n" +
							"\tthemes: [\n" +
							'\t\timport("@shikijs/themes/nord"),\n' +
							'\t\timport("@shikijs/themes/dark-plus"),\n' +
							"\t],\n" +
							"\tlangs: [\n" +
							'\t\timport("@shikijs/langs/typescript"),\n' +
							'\t\timport("@shikijs/langs/javascript"),\n' +
							"\t],\n" +
							"\tengine: createJavaScriptRegexEngine(),\n" +
							"});\n",
						type: undefined,
						_imports_: [],
						registryDependencies: [],
						dependencies: [],
						devDependencies: [],
					},
				],
				registryDependencies: [],
				dependencies: [
					{ ecosystem: "js", name: "shiki", version: undefined },
					{ ecosystem: "js", name: "@shikijs/themes", version: undefined },
					{ ecosystem: "js", name: "@shikijs/langs", version: undefined },
				],
				devDependencies: [],
				add: "when-added",
				envVars: undefined,
			},
			{
				name: "button",
				title: undefined,
				type: "component",
				description: undefined,
				basePath: "src/components/ui",
				files: [
					{
						target: undefined,
						path: "src/components/ui/button.tsx",
						content:
							"import type React from 'react';\n" +
							"\n" +
							"export function Button(props: React.ComponentProps<'button'>) {\n" +
							"\treturn <button {...props}>Click me</button>;\n" +
							"}\n",
						type: undefined,
						_imports_: [],
						registryDependencies: [],
						dependencies: [],
						devDependencies: [],
					},
				],
				registryDependencies: [],
				dependencies: [],
				devDependencies: [],
				add: "when-added",
				envVars: undefined,
			},
			{
				name: "counter",
				title: undefined,
				type: "component",
				description: undefined,
				basePath: "src/components/ui",
				files: [
					{
						target: undefined,
						path: "src/components/ui/counter.svelte",
						content:
							'<script lang="ts">\n' +
							"import { add } from '../../utils/math/add';\n" +
							"\n" +
							"let count = $state(0);\n" +
							"\n" +
							"function increment() {\n" +
							"\tcount = add(count, 1);\n" +
							"}\n" +
							"</script>\n" +
							"\n" +
							"<button onclick={increment}>\n" +
							"    Count is {count}\n" +
							"</button>",
						type: undefined,
						_imports_: [
							{
								import: "../../utils/math/add",
								item: "math",
								meta: { filePathRelativeToItem: "add.ts" },
							},
						],
						registryDependencies: [],
						dependencies: [],
						devDependencies: [],
					},
				],
				registryDependencies: ["math"],
				dependencies: [],
				devDependencies: [],
				add: "when-added",
				envVars: undefined,
			},
		] satisfies ResolvedItem[]);
	});
});

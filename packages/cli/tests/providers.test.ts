import { assert, describe, expect, it } from 'vitest';
import * as providers from '../src/utils/providers';
import * as registry from '../src/utils/registry-providers';

describe('github', () => {
	it('Fetches the manifest from a public repo', async () => {
		const repoURL = 'github/ieedan/std';

		const provider = registry.selectProvider(repoURL);

		assert(provider !== undefined);

		const providerState = await provider.state(repoURL);

		const content = await registry.fetchManifest(providerState);

		expect(content.isErr()).toBe(false);
	});

	it('Fetches the manifest from a public repo with a tag', async () => {
		const repoURL = 'https://github.com/ieedan/std/tree/v1.6.0';

		const provider = registry.selectProvider(repoURL);

		assert(provider !== undefined);

		const providerState = await provider.state(repoURL);

		// this way we just get the text and skip the schema validation
		const content = await registry.fetchRaw(providerState, 'jsrepo-manifest.json');

		expect(content.unwrap()).toBe(`[
	{
		"name": "types",
		"blocks": [
			{
				"name": "result",
				"directory": "src/types",
				"category": "types",
				"tests": true,
				"subdirectory": false,
				"files": ["result.ts", "result.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	},
	{
		"name": "utilities",
		"blocks": [
			{
				"name": "array-sum",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-sum.ts", "array-sum.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "array-to-map",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-to-map.ts", "array-to-map.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "dispatcher",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["dispatcher.ts", "dispatcher.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "ipv4-address",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["ipv4-address.ts", "ipv4-address.test.ts"],
				"localDependencies": ["types/result", "utilities/is-number"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "is-number",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["is-number.ts", "is-number.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "lines",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["lines.ts", "lines.test.ts"],
				"localDependencies": ["utilities/pad"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "map-to-array",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["map-to-array.ts", "map-to-array.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "math",
				"directory": "src/utilities/math",
				"category": "utilities",
				"tests": true,
				"subdirectory": true,
				"files": [
					"circle.test.ts",
					"circle.ts",
					"conversions.test.ts",
					"conversions.ts",
					"fractions.test.ts",
					"fractions.ts",
					"gcf.test.ts",
					"gcf.ts",
					"index.ts",
					"triangles.test.ts",
					"triangles.ts",
					"types.ts"
				],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "pad",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["pad.ts", "pad.test.ts"],
				"localDependencies": ["utilities/strip-ansi"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "sleep",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["sleep.ts", "sleep.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "stopwatch",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["stopwatch.ts", "stopwatch.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "strip-ansi",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["strip-ansi.ts", "strip-ansi.test.ts"],
				"localDependencies": [],
				"dependencies": ["ansi-regex@^6.1.0"],
				"devDependencies": []
			},
			{
				"name": "truncate",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["truncate.ts", "truncate.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	}
]
`);
	});
});

describe('gitlab', () => {
	it('Fetches the manifest from a public repo', async () => {
		const repoURL = 'gitlab/ieedan/std';

		const provider = registry.selectProvider(repoURL);

		assert(provider !== undefined);

		const providerState = await provider.state(repoURL);

		const content = await registry.fetchManifest(providerState);

		expect(content.isErr()).toBe(false);
	});

	it('Fetches the manifest from a public repo with a tag', async () => {
		const repoURL = 'https://gitlab.com/ieedan/std/-/tree/v1.6.0';

		const provider = registry.selectProvider(repoURL);

		assert(provider !== undefined);

		const providerState = await provider.state(repoURL);

		// this way we just get the text and skip the schema validation
		const content = await registry.fetchRaw(providerState, 'jsrepo-manifest.json');

		expect(content.unwrap()).toBe(`[
	{
		"name": "types",
		"blocks": [
			{
				"name": "result",
				"directory": "src/types",
				"category": "types",
				"tests": true,
				"subdirectory": false,
				"files": ["result.ts", "result.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	},
	{
		"name": "utilities",
		"blocks": [
			{
				"name": "array-sum",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-sum.ts", "array-sum.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "array-to-map",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-to-map.ts", "array-to-map.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "dispatcher",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["dispatcher.ts", "dispatcher.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "ipv4-address",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["ipv4-address.ts", "ipv4-address.test.ts"],
				"localDependencies": ["types/result", "utilities/is-number"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "is-number",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["is-number.ts", "is-number.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "lines",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["lines.ts", "lines.test.ts"],
				"localDependencies": ["utilities/pad"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "map-to-array",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["map-to-array.ts", "map-to-array.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "math",
				"directory": "src/utilities/math",
				"category": "utilities",
				"tests": true,
				"subdirectory": true,
				"files": [
					"circle.test.ts",
					"circle.ts",
					"conversions.test.ts",
					"conversions.ts",
					"fractions.test.ts",
					"fractions.ts",
					"gcf.test.ts",
					"gcf.ts",
					"index.ts",
					"triangles.test.ts",
					"triangles.ts",
					"types.ts"
				],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "pad",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["pad.ts", "pad.test.ts"],
				"localDependencies": ["utilities/strip-ansi"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "sleep",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["sleep.ts", "sleep.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "stopwatch",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["stopwatch.ts", "stopwatch.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "strip-ansi",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["strip-ansi.ts", "strip-ansi.test.ts"],
				"localDependencies": [],
				"dependencies": ["ansi-regex@^6.1.0"],
				"devDependencies": []
			},
			{
				"name": "truncate",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["truncate.ts", "truncate.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	}
]
`);
	});
});

describe('bitbucket', () => {
	it('Fetches the manifest from a public repo', async () => {
		const repoURL = 'bitbucket/ieedan/std';

		const info = await providers.bitbucket.info(repoURL);

		const content = await providers.bitbucket.fetchManifest(info);

		expect(content.isErr()).toBe(false);
	});

	it('Fetches the manifest from a public repo with a tag', async () => {
		const repoURL = 'https://bitbucket.org/ieedan/std/src/v1.6.0';

		const info = await providers.bitbucket.info(repoURL);

		const content = await providers.bitbucket.fetchRaw(info, 'jsrepo-manifest.json');

		expect(content.unwrap()).toBe(`[
	{
		"name": "types",
		"blocks": [
			{
				"name": "result",
				"directory": "src/types",
				"category": "types",
				"tests": true,
				"subdirectory": false,
				"files": ["result.ts", "result.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	},
	{
		"name": "utilities",
		"blocks": [
			{
				"name": "array-sum",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-sum.ts", "array-sum.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "array-to-map",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-to-map.ts", "array-to-map.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "dispatcher",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["dispatcher.ts", "dispatcher.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "ipv4-address",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["ipv4-address.ts", "ipv4-address.test.ts"],
				"localDependencies": ["types/result", "utilities/is-number"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "is-number",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["is-number.ts", "is-number.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "lines",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["lines.ts", "lines.test.ts"],
				"localDependencies": ["utilities/pad"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "map-to-array",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["map-to-array.ts", "map-to-array.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "math",
				"directory": "src/utilities/math",
				"category": "utilities",
				"tests": true,
				"subdirectory": true,
				"files": [
					"circle.test.ts",
					"circle.ts",
					"conversions.test.ts",
					"conversions.ts",
					"fractions.test.ts",
					"fractions.ts",
					"gcf.test.ts",
					"gcf.ts",
					"index.ts",
					"triangles.test.ts",
					"triangles.ts",
					"types.ts"
				],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "pad",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["pad.ts", "pad.test.ts"],
				"localDependencies": ["utilities/strip-ansi"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "sleep",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["sleep.ts", "sleep.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "stopwatch",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["stopwatch.ts", "stopwatch.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "strip-ansi",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["strip-ansi.ts", "strip-ansi.test.ts"],
				"localDependencies": [],
				"dependencies": ["ansi-regex@^6.1.0"],
				"devDependencies": []
			},
			{
				"name": "truncate",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["truncate.ts", "truncate.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	}
]
`);
	});
});

describe('azure', () => {
	it('Fetches the manifest from a public repo', async () => {
		const repoURL = 'azure/ieedan/std/std';

		const info = await providers.azure.info(repoURL);

		const content = await providers.azure.fetchManifest(info);

		expect(content.isErr()).toBe(false);
	});

	it('Fetches the manifest from a public repo with a tag', async () => {
		const repoURL = 'azure/ieedan/std/std/tags/v1.6.0';

		const info = await providers.azure.info(repoURL);

		const content = await providers.azure.fetchRaw(info, 'jsrepo-manifest.json');

		expect(content.unwrap()).toBe(`[
	{
		"name": "types",
		"blocks": [
			{
				"name": "result",
				"directory": "src/types",
				"category": "types",
				"tests": true,
				"subdirectory": false,
				"files": ["result.ts", "result.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	},
	{
		"name": "utilities",
		"blocks": [
			{
				"name": "array-sum",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-sum.ts", "array-sum.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "array-to-map",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["array-to-map.ts", "array-to-map.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "dispatcher",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["dispatcher.ts", "dispatcher.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "ipv4-address",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["ipv4-address.ts", "ipv4-address.test.ts"],
				"localDependencies": ["types/result", "utilities/is-number"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "is-number",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["is-number.ts", "is-number.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "lines",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["lines.ts", "lines.test.ts"],
				"localDependencies": ["utilities/pad"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "map-to-array",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["map-to-array.ts", "map-to-array.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "math",
				"directory": "src/utilities/math",
				"category": "utilities",
				"tests": true,
				"subdirectory": true,
				"files": [
					"circle.test.ts",
					"circle.ts",
					"conversions.test.ts",
					"conversions.ts",
					"fractions.test.ts",
					"fractions.ts",
					"gcf.test.ts",
					"gcf.ts",
					"index.ts",
					"triangles.test.ts",
					"triangles.ts",
					"types.ts"
				],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "pad",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["pad.ts", "pad.test.ts"],
				"localDependencies": ["utilities/strip-ansi"],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "sleep",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["sleep.ts", "sleep.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "stopwatch",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["stopwatch.ts", "stopwatch.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "strip-ansi",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["strip-ansi.ts", "strip-ansi.test.ts"],
				"localDependencies": [],
				"dependencies": ["ansi-regex@^6.1.0"],
				"devDependencies": []
			},
			{
				"name": "truncate",
				"directory": "src/utilities",
				"category": "utilities",
				"tests": true,
				"subdirectory": false,
				"files": ["truncate.ts", "truncate.test.ts"],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": []
			}
		]
	}
]
`);
	});
});

describe('http', () => {
	it('Fetches the manifest', async () => {
		const repoURL = 'https://jsrepo-http.vercel.app';

		const info = await providers.http.info(repoURL);

		const content = await providers.http.fetchRaw(info, 'jsrepo-manifest.json');

		expect(content.unwrap()).toBe(`[
	{
		"name": "types",
		"blocks": [
			{
				"name": "result",
				"directory": "src/types",
				"category": "types",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"result.ts",
					"result.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			}
		]
	},
	{
		"name": "utils",
		"blocks": [
			{
				"name": "array-sum",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"array-sum.ts",
					"array-sum.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "array-to-map",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"array-to-map.ts",
					"array-to-map.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "dispatcher",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"dispatcher.ts",
					"dispatcher.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "ipv4-address",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"ipv4-address.ts",
					"ipv4-address.test.ts"
				],
				"localDependencies": [
					"types/result",
					"utils/is-number"
				],
				"_imports_": {
					"../types/result": "{{types/result}}",
					"./is-number": "{{utils/is-number}}"
				},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "is-number",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"is-number.ts",
					"is-number.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "lines",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"lines.ts",
					"lines.test.ts"
				],
				"localDependencies": [
					"utils/pad"
				],
				"_imports_": {
					"./pad": "{{utils/pad}}"
				},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "map-to-array",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"map-to-array.ts",
					"map-to-array.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "math",
				"directory": "src/utils/math",
				"category": "utils",
				"tests": true,
				"subdirectory": true,
				"list": true,
				"files": [
					"circle.test.ts",
					"circle.ts",
					"conversions.test.ts",
					"conversions.ts",
					"fractions.test.ts",
					"fractions.ts",
					"gcf.test.ts",
					"gcf.ts",
					"index.ts",
					"triangles.test.ts",
					"triangles.ts",
					"types.ts"
				],
				"localDependencies": [],
				"dependencies": [],
				"devDependencies": [],
				"_imports_": {}
			},
			{
				"name": "pad",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"pad.ts",
					"pad.test.ts"
				],
				"localDependencies": [
					"utils/strip-ansi"
				],
				"_imports_": {
					"./strip-ansi": "{{utils/strip-ansi}}"
				},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "perishable-list",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"perishable-list.ts",
					"perishable-list.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "rand",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"rand.ts",
					"rand.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "sleep",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"sleep.ts",
					"sleep.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "stopwatch",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"stopwatch.ts",
					"stopwatch.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			},
			{
				"name": "strip-ansi",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"strip-ansi.ts",
					"strip-ansi.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [
					"ansi-regex@^6.1.0"
				],
				"devDependencies": []
			},
			{
				"name": "truncate",
				"directory": "src/utils",
				"category": "utils",
				"tests": true,
				"subdirectory": false,
				"list": true,
				"files": [
					"truncate.ts",
					"truncate.test.ts"
				],
				"localDependencies": [],
				"_imports_": {},
				"dependencies": [],
				"devDependencies": []
			}
		]
	}
]`);
	});
});

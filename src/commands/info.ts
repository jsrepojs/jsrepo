import color from 'chalk';
import { Command, program } from 'commander';
import fetch from 'make-fetch-happen';
import * as v from 'valibot';
import type { Category, Manifest } from '../types';
import * as array from '../utils/blocks/ts/array';
import * as pad from '../utils/blocks/ts/pad';
import * as jsrepo from '../utils/registry-providers/jsrepo';
import { AccessTokenManager } from '../utils/token-manager';

const schema = v.object({
	json: v.boolean(),
});

type Options = v.InferInput<typeof schema>;

export const info = new Command('info')
	.description('Get info about a registry on jsrepo.com')
	.argument('registry', 'Name of the registry to get the info for i.e. @ieedan/std')
	.option('--json', 'Output the response in formatted JSON.', false)
	.action(async (registry, opts) => {
		const options = v.parse(schema, opts);

		await _info(registry, options);
	});

async function _info(registry: string, options: Options) {
	const tokenManager = new AccessTokenManager();

	const token = tokenManager.get(jsrepo.jsrepo.name);

	const headers: Record<string, string> = {};

	if (token) {
		const [key, value] = jsrepo.jsrepo.authHeader!(token);

		headers[key] = value;
	}

	const url = new URL(`/api/scopes/${registry}`, jsrepo.BASE_URL).toString();

	const response = await fetch(url, { headers });

	if (!response.ok) {
		if (response.status === 404) {
			program.error(color.red('Registry not found!'));
		} else {
			program.error(
				color.red(
					`Error fetching registry! Error: ${response.status} - ${response.statusText}`
				)
			);
		}
	}

	const result = (await response.json()) as RegistryInfoResponse;

	if (options.json) {
		return process.stdout.write(JSON.stringify(result, null, '  '));
	}

	process.stdout.write(formattedOutput(result));
}

function formattedOutput(registryInfo: RegistryInfoResponse) {
	let out = `${color.cyan(`${registryInfo.name}@${registryInfo.version}`)} | versions: ${color.cyan(registryInfo.versions.length.toString())}\n`;

	if (registryInfo.meta.description) {
		out += `${registryInfo.meta.description}\n`;
	}

	if (registryInfo.meta.homepage) {
		out += `${color.blue(registryInfo.meta.homepage)}\n`;
	}

	out += '\n';

	if (registryInfo.meta.tags) {
		out += `keywords: ${registryInfo.meta.tags.map((t) => color.cyan(t)).join(', ')}\n\n`;
	}

	const multipleOfThree = (num: number) => num % 3 === 0;

	const blockTitles = registryInfo.categories
		.flatMap((c) => c.blocks)
		.map((b) =>
			b.list ? color.blue(`${b.category}/${b.name}`) : color.dim(`${b.category}/${b.name}`)
		);

	const minBlockTitleLength = array.maxLength(blockTitles) + 4;

	out += `blocks:
${blockTitles
	.map((b, i) => {
		const isMultipleOfThree = multipleOfThree(i + 1);
		const isLast = i + 1 >= blockTitles.length;

		if (isMultipleOfThree) {
			return `${b}\n`;
		}

		return `${pad.rightPadMin(b, minBlockTitleLength, ' ')}${isLast ? '\n' : ''}`;
	})
	.join('')}
`;

	if (registryInfo.meta.authors) {
		out += `authors:
${registryInfo.meta.authors.map((a) => `- ${color.blue(a)}`).join('\n')}\n\n`;
	}

	out += `tags:
${Object.entries(registryInfo.tags)
	.map(([tag, version]) => `${color.blue(tag)}: ${version}`)
	.join('\n')}\n\n`;

	return out;
}

type MinUser = {
	name: string;
	username: string;
	email: string;
};

type RegistryInfoResponse = {
	name: string;
	version: string;
	releasedBy: MinUser;
	primaryLanguage: string;
	firstPublishedAt: Date;
	meta: {
		authors: string[] | undefined;
		bugs: string | undefined;
		description: string | undefined;
		homepage: string | undefined;
		repository: string | undefined;
		tags: string[] | undefined;
	};
	access: NonNullable<Manifest['access']>;
	peerDependencies: NonNullable<Manifest['peerDependencies']> | null;
	configFiles: NonNullable<Manifest['configFiles']> | null;
	categories: Category[];
	tags: Record<string, string>;
	versions: string[];
	time: Record<string, Date>;
};

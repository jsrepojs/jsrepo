import * as u from '$lib/ts/url';

const BASE_ROUTE = '/docs';

type TempDoc = {
	title: string;
	slug: string;
	tag?: string;
	children?: TempDoc[];
};

export type Doc = {
	title: string;
	href: string;
	tag?: string;
	children?: Doc[];
};

// Name of the group mapped to a root doc with children
const tempMap: Record<string, [TempDoc, TempDoc[]] | [string, TempDoc[]]> = {
	'Getting Started': [
		{
			title: 'Introduction',
			slug: ''
		},
		[
			{
				title: 'Setup',
				slug: 'setup'
			},
			{
				title: 'jsrepo.json',
				slug: 'jsrepo-json'
			}
		]
	],
	CLI: [
		'cli',
		[
			{
				title: 'add',
				slug: 'add'
			},
			{
				title: 'auth',
				slug: 'auth'
			},
			{
				title: 'build',
				slug: 'build'
			},
			{
				title: 'exec',
				slug: 'exec'
			},
			{
				title: 'init',
				slug: 'init'
			},
			{
				title: 'test',
				slug: 'test'
			},
			{
				title: 'update',
				slug: 'update'
			}
		].sort(sortAlphabetical)
	],
	'Create Your Registry': [
		{
			title: 'Getting Started',
			slug: 'registry'
		},
		[
			{
				title: 'Choose a Provider',
				slug: 'providers',
				children: [
					{
						title: 'GitHub',
						slug: 'github'
					},
					{
						title: 'GitLab',
						slug: 'gitlab'
					},
					{
						title: 'BitBucket',
						slug: 'bitbucket'
					},
					{
						title: 'AzureDevops',
						slug: 'azure'
					},
					{
						title: 'Self Hosted',
						slug: 'self-hosted'
					}
				]
			},
			{
				title: 'Language Support',
				slug: 'language-support'
			},
			{
				title: 'Dynamic Registries',
				slug: 'dynamic'
			},
			{
				title: 'Badges',
				slug: 'badges'
			},
			{
				title: 'jsrepo-build-config.json',
				slug: 'jsrepo-build-config-json'
			}
		]
	],
	Integrations: [
		'integrations',
		[
			{
				title: 'Raycast Extension',
				slug: 'https://www.raycast.com/ieedan/jsrepo'
			}
		]
	]
};

export const map = buildMap(tempMap);

function buildMap(initial: typeof tempMap): Record<string, Doc[]> {
	const result: Record<string, Doc[]> = {};

	for (const [title, value] of Object.entries(initial)) {
		const [rootDoc, docs] = value;

		if (typeof rootDoc === 'string') {
			const baseHref = u.join(BASE_ROUTE, rootDoc);

			const children = fillHref(baseHref, docs);

			result[title] = children ?? [];
		} else {
			const baseHref = u.join(BASE_ROUTE, rootDoc.slug);

			const children = fillHref(baseHref, docs);

			result[title] = [{ ...rootDoc, href: baseHref, children: undefined }, ...(children ?? [])];
		}
	}

	return result;
}

function fillHref(baseHref: string, docs: TempDoc[] | undefined): Doc[] | undefined {
	if (docs === undefined) return undefined;

	const result: Doc[] = [];

	for (const doc of docs) {
		const children = fillHref(u.join(baseHref, doc.slug), doc.children);

		result.push({
			...doc,
			// external links are kept
			href: doc.slug.startsWith('https://') ? doc.slug : u.join(baseHref, doc.slug),
			children
		});
	}

	return result;
}

function sortAlphabetical(a: TempDoc, b: TempDoc) {
	const titleA = a.title.toUpperCase();
	const titleB = b.title.toUpperCase();

	if (titleA < titleB) {
		return -1;
	}
	if (titleA > titleB) {
		return 1;
	}

	// Names must be equal
	return 0;
}

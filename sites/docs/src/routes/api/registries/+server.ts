import { redis, VIEW_SET_NAME } from '$lib/ts/redis-client';
import { getProviderState, getRegistryData, getStateKey, type RegistryInfo } from '$lib/ts/registry';
import { error, json } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';
import * as array from '$lib/ts/array.js';

type RegistryResponse = {
	registries:
		| (RegistryInfo & { url: string; provider: string })[]
		| { url: string; provider: string }[];
	hasMore: boolean;
};

export async function GET({ url }) {
	// limit the maximum possible retrieved rows to 100
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
	const offset = parseInt(url.searchParams.get('offset') ?? '0');
	const descending = url.searchParams.get('order') !== 'asc';
	const withData = (url.searchParams.get('with_data') ?? 'true') === 'true';

	const urls = (await redis.zrange(VIEW_SET_NAME, 0, -1, {
		rev: descending,
		count: limit + 1,
		offset: offset
	})) as string[];

	const registries = await Promise.all(
		urls.map(async (url, i) => {
			try {
				const provider = selectProvider(url);

				if (!provider) return undefined;

				const normalizedUrl = provider.parse(url, { fullyQualified: false }).url;

				if (!withData) {
					return {
						order: i,
						url: normalizedUrl,
						provider: provider.name
					};
				}

				const state = await getProviderState(url, provider, { cache: true });

				const pageData = await getRegistryData(state);

				if (pageData === undefined) return undefined;

				return {
					order: i,
					readme: pageData.readme,
					manifest: pageData.manifest,
					url: normalizedUrl,
					provider: provider.name
				};
			} catch {
				return undefined;
			}
		})
	);

	const validRegistries = registries.flatMap((r) => {
		if (r === undefined) return [];

		return [r];
	});

	const uniqueRegistries = array.toMap(validRegistries, (r) => [r.url, r]);

	const result = array
		.fromMap(uniqueRegistries, (_, r) => r)
		.sort((a, b) => a.order - b.order)
		.map((r) => ({ ...r, order: undefined }));

	return json({
		registries: result,
		hasMore: urls.length > limit
	} satisfies RegistryResponse);
}

export async function POST({ request }) {
	const body = await request.json();

	if (typeof body !== 'object') {
        throw error(400, 'request body should be an object with the `url` property!');
    }

	if (typeof body.url !== 'string') throw error(400, 'the `url` property is required and must be a string!');

    const url = body.url as string;

    const provider = selectProvider(url);

    if (!provider) throw error(400, 'invalid registry url!');

    const normalizedUrl = provider.parse(url, { fullyQualified: false });

    const state = await getProviderState(url, provider, { cache: false });

    const data = await getRegistryData(state);

    if (data === undefined) throw error(404, 'invalid registry');

    // cache state
    await redis.set(getStateKey(normalizedUrl.url), state);

    return json(data);
}

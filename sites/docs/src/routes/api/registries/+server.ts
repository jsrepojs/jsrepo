import { getProviderState, getRegistryData } from '$lib/ts/registry';
import { error, json } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';
import * as array from '$lib/ts/array.js';
import { db, functions } from '$lib/backend/db/index.js';
import { registries } from '$lib/backend/db/schema.js';
import { desc, isNotNull, ilike, count } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { RegistryResponse } from './types';

export async function GET({ url }) {
	// limit the maximum possible retrieved rows to 100
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
	const offset = parseInt(url.searchParams.get('offset') ?? '0');
	const descending = (url.searchParams.get('order') ?? 'asc') === 'desc';
	const orderBy = url.searchParams.get('order_by');
	const withData = (url.searchParams.get('with_data') ?? 'true') === 'true';
	const query = url.searchParams.get('query');

	let orderByColumn: PgColumn;

	switch (orderBy) {
		case 'views':
			orderByColumn = registries.views;
			break;
		default:
			orderByColumn = registries.url;
			break;
	}

	const [registryCount, urls] = await Promise.all([
		db
			.select({ count: count() })
			.from(registries)
			.where(query !== null ? ilike(registries.url, `%${query}%`) : isNotNull(registries.url)), // isNotNull is to say always match
		db
			.select()
			.from(registries)
			.where(query !== null ? ilike(registries.url, `%${query}%`) : isNotNull(registries.url)) // isNotNull is to say always match
			.orderBy(descending ? desc(orderByColumn) : orderByColumn)
			.offset(offset)
			.limit(limit)
	]);

	const registryData = await Promise.all(
		urls.map(async ({ url }, i) => {
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

	const validRegistries = registryData.flatMap((r) => {
		if (r === undefined) return [];

		return [r];
	});

	const uniqueRegistries = array.toMap(validRegistries, (r) => [r.url, r]);

	const result = array
		.fromMap(uniqueRegistries, (_, r) => r)
		.sort((a, b) => a.order - b.order)
		.map((r) => ({ ...r, order: undefined }));

	const total = registryCount[0].count;

	return json({
		registries: result,
		hasMore: total > limit + offset,
		total
	} satisfies RegistryResponse);
}

export async function POST({ request }) {
	const body = await request.json();

	if (typeof body !== 'object') {
		throw error(400, 'request body should be an object with the `url` property!');
	}

	if (typeof body.url !== 'string')
		throw error(400, 'the `url` property is required and must be a string!');

	const url = body.url as string;

	const provider = selectProvider(url);

	if (!provider) throw error(400, 'invalid registry url!');

	const normalizedUrl = provider.parse(url, { fullyQualified: false });

	const state = await getProviderState(url, provider);

	const data = await getRegistryData(state);

	if (data === undefined) throw error(404, 'invalid registry');

	await functions.tryInsert(normalizedUrl.url);

	return json(data);
}

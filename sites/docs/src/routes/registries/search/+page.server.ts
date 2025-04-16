import { error, redirect } from '@sveltejs/kit';
import type { RegistryResponse } from '../../api/registries/types.js';

export async function load({ url, fetch }) {
	const query = url.searchParams.get('query');

	if (query === null) redirect(303, '/registries');

	const limit = 15;
	const offset = parseInt(url.searchParams.get('offset') ?? '0');
	const order = url.searchParams.get('order') ?? 'asc';
	let orderBy = url.searchParams.get('order_by') ?? 'alphabetical';

	if (orderBy !== 'alphabetical' && orderBy !== 'views') {
		orderBy = 'alphabetical';
	}

	const search = `?with_data=false&query=${query}&order=${order}&offset=${offset}&limit=${limit}&order_by=${orderBy}`;

	const response = fetchResults(search, fetch);

	return {
		query,
		limit,
		response
	};
}

async function fetchResults(
	search: string,
	f: typeof fetch
): Promise<RegistryResponse | undefined> {
	try {
		const requestUrl = `/api/registries${search}`;

		const response = await f(requestUrl);

		if (!response.ok) {
			error(response.status);
		}

		return await response.json();
	} catch {
		return undefined;
	}
}

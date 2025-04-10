import { getDoc } from '$lib/docs/index';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const doc = await getDoc(params.slug);

	if (!doc) {
		throw error(404, 'Not Found')
	}

	return doc;
}

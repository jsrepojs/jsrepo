import { getDoc } from '$lib/docs/index';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const doc = await getDoc(params.slug);

	if (!doc) {
		error(404);
	}

	return doc;
}

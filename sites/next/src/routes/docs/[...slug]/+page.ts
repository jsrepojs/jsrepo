import { getDoc } from '$lib/docs/index';

export async function load({ params }) {
	const doc = await getDoc(params.slug);

	return doc;
}

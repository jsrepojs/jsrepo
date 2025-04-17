import { getFeatured, getPopular } from '$lib/backend/db/functions';

export async function load() {
	const featured = getFeatured();
	const popular = getPopular();

	return {
		popular,
		featured
	};
}

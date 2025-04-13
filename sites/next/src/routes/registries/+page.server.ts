import { getFeatured, getPopular } from '$lib/backend/db/functions';

export async function load() {
	const [featured, popular] = await Promise.all([getFeatured(), getPopular()]);

	return {
		popular,
		featured
	};
}
import { error } from '@sveltejs/kit';

export async function load() {
	// @ts-expect-error wrong
	const doc = await import('../../lib/docs/index.md');

	if (!doc || !doc.metadata) {
		error(404);
	}

	return {
		...doc.metadata,
		path: '/',
		component: doc.default
	};
}

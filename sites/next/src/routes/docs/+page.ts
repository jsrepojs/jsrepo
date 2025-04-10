import { error } from '@sveltejs/kit';
import { docs, type Docs } from '../../../.velite';

export async function load() {
    const doc = await import('../../lib/docs/index.md')

    if (!doc || !doc.metadata) {
        error(404)
    }

	return {
        ...doc.metadata,
        component: doc.default
    };
}

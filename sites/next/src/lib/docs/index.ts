import type { Component } from 'svelte';
import { docs, type Docs } from '$content/index';

const base = '/src/lib/docs/';

export async function getDoc(slug: string) {
	const modules = import.meta.glob('/src/lib/docs/**/*.md');
	const doc = matchDoc(slug, modules);
	const component = (await doc?.resolver())?.default;

	const metadata = docs.find((d) => d.path === slug);

	if (!metadata || !component) {
		return undefined;
	}

	return {
		...metadata,
		component
	};
}

type Modules = Record<string, () => Promise<unknown>>;
type Resolver = () => Promise<DocFile>;

type DocFile = {
	default: Component;
	metadata: Docs;
};

function matchDoc(
	slug: string,
	modules: Modules
): { path: string; resolver: Resolver } | undefined {
	for (const [path, resolver] of Object.entries(modules)) {
		const stripped = path.slice(base.length);

		if (`${slug}.md` === stripped) {
			return { path, resolver: resolver as Resolver };
		}

		const index = '/index.md';

		if (stripped.endsWith(index)) {
			if (slug === `${stripped.slice(0, stripped.length - index.length)}`) {
				return { path, resolver: resolver as Resolver };
			}
		}
	}

	return undefined;
}

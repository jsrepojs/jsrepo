import FlexSearch from 'flexsearch';

export type IndexEntry = {
	id: number;
	title: string;
	href: string;
	content: string;
};

let index: FlexSearch.Index;
let content: Map<number, IndexEntry>;

export function createIndex(searchIndex: { docs: IndexEntry[] }) {
	content = new Map();

	index = new FlexSearch.Index({
		tokenize: 'forward',
		resolution: 9
	});

	for (const entry of searchIndex.docs) {
		index.add(entry.id, entry.content);
		content.set(entry.id, entry);
	}
}

export function searchIndex(query: string): IndexEntry[] {
	if (!index) return [];

	const results = index.search(query, { suggest: true }) as number[];

	return results.map((index: number) => content.get(index)!);
}

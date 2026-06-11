import { describe, expect, it } from 'vitest';
import { formatResult, type ListCommandResult, type ListItem } from '@/commands/list';

type ListManifestItem = ListItem['item'];

const REGISTRY = {
	url: '@example/svelte',
} as ListCommandResult['registries'][number];

const OTHER_REGISTRY = {
	url: '@example/react',
} as ListCommandResult['registries'][number];

const BUTTON_ITEM = {
	name: 'button',
	title: 'Button',
	description: 'A reusable button component.',
	type: 'ui',
	add: 'when-added' as const,
	files: [
		{
			path: 'button/button.svelte',
			type: 'ui',
			role: 'file',
			target: undefined,
		},
	],
} as unknown as ListManifestItem;

const UTILS_ITEM = {
	name: 'utils',
	type: 'lib',
	add: 'when-added' as const,
	files: [],
} as unknown as ListManifestItem;

const CARD_ITEM = {
	name: 'card',
	title: 'Card',
	description: 'A card component.',
	type: 'ui',
	add: 'when-added' as const,
	files: [],
} as unknown as ListManifestItem;

function createResult(overrides: Partial<ListCommandResult> = {}): ListCommandResult {
	return {
		registries: [REGISTRY],
		items: [
			{ registry: REGISTRY, item: BUTTON_ITEM },
			{ registry: REGISTRY, item: UTILS_ITEM },
		],
		detail: 'basic',
		...overrides,
	};
}

describe('formatResult', () => {
	it('formats a single registry without registry headers', () => {
		const output = formatResult(createResult());

		expect(output).toContain('button');
		expect(output).toContain('Button');
		expect(output).toContain('A reusable button component.');
		expect(output).not.toContain('@example/svelte');
	});

	it('groups items by registry when multiple registries are listed', () => {
		const output = formatResult(
			createResult({
				registries: [REGISTRY, OTHER_REGISTRY],
				items: [
					{ registry: REGISTRY, item: BUTTON_ITEM },
					{ registry: REGISTRY, item: UTILS_ITEM },
					{ registry: OTHER_REGISTRY, item: CARD_ITEM },
				],
			})
		);

		expect(output).toContain('@example/svelte');
		expect(output).toContain('@example/react');
		expect(output.indexOf('@example/svelte')).toBeLessThan(output.indexOf('button'));
		expect(output.indexOf('@example/react')).toBeLessThan(output.indexOf('card'));
	});

	it('includes full detail when requested', () => {
		const output = formatResult(
			createResult({
				detail: 'full',
				items: [{ registry: REGISTRY, item: BUTTON_ITEM }],
			})
		);

		expect(output).toContain('type: ui');
		expect(output).toContain('files:');
		expect(output).toContain('button/button.svelte');
	});

	it('returns a message when no items are found', () => {
		const output = formatResult(
			createResult({
				items: [],
			})
		);

		expect(output).toContain('No items found.');
	});
});

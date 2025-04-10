/*
	Installed from github/ieedan/shadcn-svelte-extras
*/

export type HeadingKind = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type Heading = {
	index: number;
	ref: Element;
	kind: HeadingKind;
	id?: string;
	level: number;
	label: string;
	active: boolean;
	children: Heading[];
};

export const INDEX_ATTRIBUTE = 'data-toc-index';

/** A hook for generating a table of contents using the page content.
 *
 * ## Usage
 * ```svelte
 * <script lang="ts">
 * 		const toc = new UseToc();
 * </script>
 *
 * <div bind:this={toc.ref} style="display: contents;">
 * 		<h1>Table of Contents</h1>
 * 		<h2>Usage</h2>
 * </div>
 * ```
 */
export class UseToc {
	#ref = $state<Element>();
	#toc = $state<Heading[]>([]);

	// This sets everything up once #ref is bound
	set ref(ref: Element | undefined) {
		this.#ref = ref;

		if (!this.#ref) return;

		this.#toc = getToc(this.#ref);

		// should detect if a heading is added / removed / updated
		const mutationObserver = new MutationObserver(() => {
			if (!this.#ref) return;

			this.#toc = getToc(this.#ref);
		});

		mutationObserver.observe(this.#ref, { childList: true, subtree: true });

		const resetActiveHeading = (headings: Heading[]) => {
			for (let i = 0; i < headings.length; i++) {
				headings[i].active = false;

				resetActiveHeading(headings[i].children);
			}
		};

		const setHeadingActive = (headings: Heading[], index: number) => {
			for (let i = 0; i < headings.length; i++) {
				if (index === headings[i].index) {
					headings[i].active = true;
					break;
				}

				setHeadingActive(headings[i].children, index);
			}
		};

		// reactive to the table of contents
		$effect(() => {
			const intersectionObserver = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						resetActiveHeading(this.#toc);

						const index = entry.target.getAttribute(INDEX_ATTRIBUTE);

						setHeadingActive(this.#toc, parseInt(index ?? '-1'));
					}
				}
			});

			this.#toc.forEach((heading) => {
				intersectionObserver.observe(heading.ref);
			});

			return () => intersectionObserver.disconnect();
		});
	}

	get ref() {
		return this.#ref;
	}

	/** The generated table of contents */
	get current() {
		return this.#toc;
	}
}

const createHeading = (element: HTMLHeadingElement, index: number): Heading => {
	const kind = element.tagName.toLowerCase() as HeadingKind;

	element.setAttribute(INDEX_ATTRIBUTE, index.toString());

	return {
		index,
		ref: element,
		kind,
		id: element.id,
		level: parseInt(kind[1]),
		label: element.innerText ?? '',
		active: true,
		children: []
	};
};

/** Gets all of the headings contained in the provided element and create a table of contents.
 *
 * @param el
 * @returns
 */
const getToc = (el: Element): Heading[] => {
	const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h, i) =>
		createHeading(h as HTMLHeadingElement, i)
	);

	if (headings.length === 0) return [];

	const toc: Heading[] = [];

	let i = 0;

	while (i < headings.length) {
		const heading = headings[i];

		const nextIndex = addChildren(headings, heading, i + 1);

		toc.push(heading);

		i = nextIndex;
	}

	return toc;
};

const addChildren = (headings: Heading[], base: Heading, index: number): number => {
	let i = index;

	while (i < headings.length) {
		const sub = headings[i];

		// example: h1 < h2 or h1 = h1
		if (sub.level <= base.level) break;

		const nextIndex = addChildren(headings, sub, i + 1);

		base.children.push(sub);

		i = nextIndex;
	}

	return i;
};

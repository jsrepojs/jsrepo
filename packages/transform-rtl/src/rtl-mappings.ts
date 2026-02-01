/**
 * RTL (right-to-left) mappings for Tailwind CSS classes.
 * Based on shadcn-ui's transform-rtl. Physical → logical class mappings.
 * Order matters: negative before positive, specific before general.
 */
const RTL_MAPPINGS: [string, string][] = [
	['-ml-', '-ms-'],
	['-mr-', '-me-'],
	['ml-', 'ms-'],
	['mr-', 'me-'],
	['pl-', 'ps-'],
	['pr-', 'pe-'],
	['-left-', '-start-'],
	['-right-', '-end-'],
	['left-', 'start-'],
	['right-', 'end-'],
	['inset-l-', 'inset-inline-start-'],
	['inset-r-', 'inset-inline-end-'],
	['rounded-tl-', 'rounded-ss-'],
	['rounded-tr-', 'rounded-se-'],
	['rounded-bl-', 'rounded-es-'],
	['rounded-br-', 'rounded-ee-'],
	['rounded-l-', 'rounded-s-'],
	['rounded-r-', 'rounded-e-'],
	['border-l-', 'border-s-'],
	['border-r-', 'border-e-'],
	['border-l', 'border-s'],
	['border-r', 'border-e'],
	['text-left', 'text-start'],
	['text-right', 'text-end'],
	['scroll-ml-', 'scroll-ms-'],
	['scroll-mr-', 'scroll-me-'],
	['scroll-pl-', 'scroll-ps-'],
	['scroll-pr-', 'scroll-pe-'],
	['float-left', 'float-start'],
	['float-right', 'float-end'],
	['clear-left', 'clear-start'],
	['clear-right', 'clear-end'],
	['origin-top-left', 'origin-top-start'],
	['origin-top-right', 'origin-top-end'],
	['origin-bottom-left', 'origin-bottom-start'],
	['origin-bottom-right', 'origin-bottom-end'],
	['origin-left', 'origin-start'],
	['origin-right', 'origin-end'],
];

const RTL_TRANSLATE_X_MAPPINGS: [string, string][] = [
	['-translate-x-', 'translate-x-'],
	['translate-x-', '-translate-x-'],
];

const RTL_REVERSE_MAPPINGS: [string, string][] = [
	['space-x-', 'space-x-reverse'],
	['divide-x-', 'divide-x-reverse'],
];

const RTL_SWAP_MAPPINGS: [string, string][] = [
	['cursor-w-resize', 'cursor-e-resize'],
	['cursor-e-resize', 'cursor-w-resize'],
];

const RTL_LOGICAL_SIDE_SLIDE_MAPPINGS: [string, string, string][] = [
	['data-[side=inline-start]', 'slide-in-from-right', 'slide-in-from-end'],
	['data-[side=inline-start]', 'slide-out-to-right', 'slide-out-to-end'],
	['data-[side=inline-end]', 'slide-in-from-left', 'slide-in-from-start'],
	['data-[side=inline-end]', 'slide-out-to-left', 'slide-out-to-start'],
];

const RTL_FLIP_MARKER = 'cn-rtl-flip';

const POSITIONING_PREFIXES = ['-left-', '-right-', 'left-', 'right-'];

/**
 * Splits a className into [variant, name, modifier].
 * e.g. hover:bg-primary-100 -> [hover, bg-primary, 100]
 * e.g. sm:group-data-[size=default]/alert-dialog-content:text-left -> [sm:group-data-[size=default]/alert-dialog-content, text-left, null]
 */
export function splitClassName(className: string): (string | null)[] {
	if (!className.includes('/') && !className.includes(':')) {
		return [null, className, null];
	}

	let lastColonIndex = -1;
	let bracketDepth = 0;
	for (let i = className.length - 1; i >= 0; i--) {
		const char = className[i];
		if (char === ']') bracketDepth++;
		else if (char === '[') bracketDepth--;
		else if (char === ':' && bracketDepth === 0) {
			lastColonIndex = i;
			break;
		}
	}

	let variant: string | null = null;
	let nameWithAlpha: string;

	if (lastColonIndex === -1) {
		nameWithAlpha = className;
	} else {
		variant = className.slice(0, lastColonIndex);
		nameWithAlpha = className.slice(lastColonIndex + 1);
	}

	const slashIndex = nameWithAlpha.lastIndexOf('/');
	if (slashIndex === -1) {
		return [variant, nameWithAlpha, null];
	}

	const name = nameWithAlpha.slice(0, slashIndex);
	const alpha = nameWithAlpha.slice(slashIndex + 1);
	return [variant, name, alpha];
}

/**
 * Applies RTL mapping to a string of Tailwind class names.
 * Converts physical (left/right) classes to logical (start/end) and adds rtl: variants where needed.
 */
export function applyRtlMapping(input: string): string {
	return input
		.split(' ')
		.flatMap((className) => {
			if (className.startsWith('rtl:') || className.startsWith('ltr:')) {
				return [className];
			}

			if (className === RTL_FLIP_MARKER) {
				return ['rtl:rotate-180'];
			}

			const [variant, value, modifier] = splitClassName(className);
			if (!value) {
				return [className];
			}

			// Translate-x: add rtl: variant
			for (const [physical, rtlPhysical] of RTL_TRANSLATE_X_MAPPINGS) {
				if (value.startsWith(physical)) {
					const rtlValue = value.replace(physical, rtlPhysical);
					const rtlClass = variant
						? `rtl:${variant}:${rtlValue}${modifier ? `/${modifier}` : ''}`
						: `rtl:${rtlValue}${modifier ? `/${modifier}` : ''}`;
					return [className, rtlClass];
				}
			}

			// space-x / divide-x: add rtl:*-reverse
			for (const [prefix, reverseClass] of RTL_REVERSE_MAPPINGS) {
				if (value.startsWith(prefix)) {
					const rtlClass = variant
						? `rtl:${variant}:${reverseClass}`
						: `rtl:${reverseClass}`;
					return [className, rtlClass];
				}
			}

			// cursor swap
			for (const [physical, swapped] of RTL_SWAP_MAPPINGS) {
				if (value === physical) {
					const rtlClass = variant ? `rtl:${variant}:${swapped}` : `rtl:${swapped}`;
					return [className, rtlClass];
				}
			}

			// Slide animations inside logical side variants
			for (const [variantPattern, physical, logical] of RTL_LOGICAL_SIDE_SLIDE_MAPPINGS) {
				if (variant?.includes(variantPattern) && value.startsWith(physical)) {
					const mappedValue = value.replace(physical, logical);
					return [
						modifier
							? `${variant}:${mappedValue}/${modifier}`
							: `${variant}:${mappedValue}`,
					];
				}
			}

			const isPhysicalSideVariant =
				variant?.includes('data-[side=left]') || variant?.includes('data-[side=right]');

			let mappedValue = value;
			for (const [physical, logical] of RTL_MAPPINGS) {
				if (
					isPhysicalSideVariant &&
					POSITIONING_PREFIXES.some((p) => physical.startsWith(p))
				) {
					continue;
				}
				if (value.startsWith(physical)) {
					if (!physical.endsWith('-') && value !== physical) {
						continue;
					}
					mappedValue = value.replace(physical, logical);
					break;
				}
			}

			const result = variant
				? modifier
					? `${variant}:${mappedValue}/${modifier}`
					: `${variant}:${mappedValue}`
				: modifier
					? `${mappedValue}/${modifier}`
					: mappedValue;
			return [result];
		})
		.join(' ');
}

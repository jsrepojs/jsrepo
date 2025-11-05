import pc from 'picocolors';

export function displaySize(bytes: number): string {
	const showYellow = bytes > KILOBYTE * 500;
	const showRed = bytes > MEGABYTE;

	function getSizeString(bytes: number) {
		if (bytes < KILOBYTE) return `${displayDividedSize(bytes)} B`;

		if (bytes < MEGABYTE) return `${displayDividedSize(bytes / KILOBYTE)} KB`;

		if (bytes < GIGABYTE) return `${displayDividedSize(bytes / MEGABYTE)} MB`;

		return `${displayDividedSize(bytes / GIGABYTE)} GB`;
	}

	return showRed
		? pc.red(getSizeString(bytes))
		: showYellow
			? pc.yellow(getSizeString(bytes))
			: getSizeString(bytes);
}

export function displayDividedSize(size: number): string {
	const sizeStr = size.toFixed(2);
	return sizeStr.endsWith('.00') ? sizeStr.slice(0, -3) : sizeStr;
}

// Utilities for working with file sizes
export const BYTE = 1;
export const KILOBYTE = 1024;
export const MEGABYTE = 1024 * KILOBYTE;
export const GIGABYTE = 1024 * MEGABYTE;

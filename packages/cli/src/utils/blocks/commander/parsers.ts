import { InvalidArgumentError } from 'commander';

/** Handles `--x foo=bar,bar=foo`
 *
 * @param value
 * @returns
 */
export function parseRecord(value: string | undefined): Record<string, string> | undefined {
	if (value === undefined) return undefined;

	const result: Record<string, string> = {};

	for (const pair of value.split(',')) {
		const [key, value] = pair.split('=');

		if (key === undefined || value === undefined) {
			throw new InvalidArgumentError(
				'Expected map to be provided in the following format: `--option key=value,key=value`'
			);
		}

		result[key] = value;
	}

	return result;
}

import * as v from 'valibot';
import { type Manifest, categorySchema, manifestSchema } from '../types';
import { Err, Ok, type Result } from './blocks/ts/result';

/** Parses the json string (if it can be) into a manifest.
 *
 * @param json
 */
export function parseManifest(json: string): Result<Manifest, string> {
	let parsed: unknown;

	try {
		parsed = JSON.parse(json);
	} catch (err) {
		return Err(`Error parsing manifest json ${err}`);
	}

	// first gen array-based config
	if (Array.isArray(parsed)) {
		const validated = v.safeParse(v.array(categorySchema), parsed);

		if (!validated.success) {
			return Err(
				`Error parsing categories (array-based config) ${validated.issues.join(' ')}`
			);
		}

		return Ok({
			private: false,
			categories: validated.output,
		});
	}

	const validated = v.safeParse(manifestSchema, parsed);

	if (!validated.success) {
		return Err(`Error parsing manifest ${validated.issues.join(' ')}`);
	}

	return Ok(validated.output);
}

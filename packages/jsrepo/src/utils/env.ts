import { existsSync, readFileSync } from './fs';
import { dirname, joinAbsolute } from './path';
import type { AbsolutePath } from './types';

export const ENV_FILE_NAMES = [
	'.env.local',
	'.env',
	'.env.development.local',
	'.env.development',
] as const;

export function searchForEnvFile(
	cwd: AbsolutePath
): { path: AbsolutePath; envVars: Record<string, string>; contents: string } | null {
	for (const envFileName of ENV_FILE_NAMES) {
		const envFilePath = joinAbsolute(cwd, envFileName);
		if (!existsSync(envFilePath)) continue;

		const contentsResult = readFileSync(envFilePath);
		if (contentsResult.isErr()) continue;
		const contents = contentsResult.value;

		const envVars = parseEnvVariables(contents);
		return { path: envFilePath, envVars, contents };
	}
	const newCwd = dirname(cwd);
	if (newCwd === cwd) return null;
	return searchForEnvFile(newCwd);
}

export function parseEnvVariables(contents: string): Record<string, string> {
	const result: Record<string, string> = {};
	const lines = contents.split('\n');
	let currentKey: string | null = null;
	let currentValue: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line === undefined) continue;
		const trimmedLine = line.trim();

		// If we're continuing a multiline value (previous line ended with backslash)
		if (currentKey !== null && currentValue.length > 0) {
			// Check if this line ends with backslash (continues to next line)
			if (line.trimEnd().endsWith('\\')) {
				// Remove the trailing backslash and leading whitespace, then continue
				const continuationLine = line.trimEnd().slice(0, -1).replace(/^\s+/, '');
				currentValue.push(continuationLine);
				continue;
			} else {
				// Check if this line looks like a new variable
				// If it does, finalize the multiline value first
				let looksLikeNewVar = false;
				if (trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
					const firstEqualIndex = line.indexOf('=');
					if (firstEqualIndex > 0) {
						const potentialName = line.slice(0, firstEqualIndex).trim();
						// Check if it looks like a valid variable name (alphanumeric/underscore)
						if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(potentialName)) {
							looksLikeNewVar = true;
						}
					}
				}
				
				if (looksLikeNewVar) {
					// Multiline value is complete - finalize it
					// Remove any trailing empty lines
					while (currentValue.length > 0 && currentValue[currentValue.length - 1] === '') {
						currentValue.pop();
					}
					result[currentKey] = currentValue.join('\n');
					currentKey = null;
					currentValue = [];
					// Continue processing this line as a new variable
				} else {
					// Add this line to the multiline value and continue
					// Only add non-empty lines, or empty lines if we're explicitly continuing
					const continuationLine = line.replace(/^\s+/, '');
					currentValue.push(continuationLine);
					continue;
				}
			}
		}

		// Skip empty lines (only if we're not in a multiline value)
		if (trimmedLine.length === 0) {
			continue;
		}

		// Check for comments
		if (trimmedLine.startsWith('#')) {
			continue;
		}

		const firstEqualIndex = line.indexOf('=');
		if (firstEqualIndex === -1) {
			// If we're in a multiline value, this line is a continuation
			if (currentKey !== null) {
				currentValue.push(line.replace(/^\s+/, ''));
				continue;
			}
			// Otherwise, skip lines without =
			continue;
		}

		const name = line.slice(0, firstEqualIndex).trim();
		let value = line.slice(firstEqualIndex + 1);

		// Check if line ends with backslash (multiline continuation)
		if (line.trimEnd().endsWith('\\')) {
			// Remove the trailing backslash and start building multiline value
			currentKey = name;
			currentValue = [value.slice(0, -1).trimEnd()];
			continue;
		}

		// Single line value - preserve as-is (including quotes)
		result[name] = value ?? '';
	}

	// Handle case where file ends with a multiline value
	if (currentKey !== null) {
		// Remove any trailing empty lines
		while (currentValue.length > 0 && currentValue[currentValue.length - 1] === '') {
			currentValue.pop();
		}
		result[currentKey] = currentValue.join('\n');
	}

	return result;
}

export function updateEnvFile(contents: string, envVars: Record<string, string>): string {
	const parsedEnvVars = parseEnvVariables(contents);

	let totalEnvVars = Object.keys(parsedEnvVars).length;

	for (const [name, value] of Object.entries(envVars)) {
		if (parsedEnvVars[name] === undefined) {
			contents += `${totalEnvVars === 0 ? '' : '\n'}${name}=${value}`;
		} else {
			if (value === '') continue;
			contents = contents.replace(`${name}=${parsedEnvVars[name]}`, `${name}=${value}`);
		}
		totalEnvVars++;
	}

	return contents;
}

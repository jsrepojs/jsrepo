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
	const lines = contents.split('\n');
	const result: Record<string, string> = {};
	let i = 0;

	while (i < lines.length) {
		const line = lines[i]!;
		const trimmedLine = line.trim();

		// Skip empty lines
		if (trimmedLine.length === 0) {
			i++;
			continue;
		}

		// Skip comment lines (lines starting with #)
		if (trimmedLine.startsWith('#')) {
			i++;
			continue;
		}

		const firstEqualIndex = trimmedLine.indexOf('=');
		if (firstEqualIndex === -1) {
			i++;
			continue;
		}

		const name = trimmedLine.slice(0, firstEqualIndex).trim();
		let value = trimmedLine.slice(firstEqualIndex + 1);

		// Check if this is a multi-line value (starts with quote but doesn't end with quote on same line)
		if (value.startsWith('"') && !value.endsWith('"')) {
			// Multi-line value - accumulate lines until we find the closing quote
			const valueLines: string[] = [value];
			i++;

			while (i < lines.length) {
				const nextLine = lines[i]!;
				valueLines.push(nextLine);

				// Check if this line ends with a closing quote
				if (nextLine.trim().endsWith('"')) {
					break;
				}
				i++;
			}

			// Join all lines, preserve newlines, and strip quotes
			const joined = valueLines.join('\n');
			// Remove opening quote from first line and closing quote from last line
			if (joined.startsWith('"') && joined.endsWith('"')) {
				value = `${joined.slice(1, -1)}\n`;
			} else {
				value = joined;
			}
		} else {
			// Single-line value - handle comments
			// If value is quoted, find the closing quote first, then strip comments after it
			if (value.startsWith('"') && value.endsWith('"')) {
				// Quoted single-line value - comments can appear after the closing quote
				const closingQuoteIndex = value.lastIndexOf('"');
				if (closingQuoteIndex !== -1 && closingQuoteIndex < value.length - 1) {
					// There's content after the closing quote - check for comment
					const afterQuote = value.slice(closingQuoteIndex + 1);
					const commentIndex = afterQuote.indexOf('#');
					if (commentIndex !== -1) {
						// Strip comment and any whitespace before it
						value = value.slice(0, closingQuoteIndex + 1 + commentIndex).trimEnd();
					}
				}
			} else {
				// Unquoted value - find first # and strip everything after it (and whitespace before it)
				const commentIndex = value.indexOf('#');
				if (commentIndex !== -1) {
					value = value.slice(0, commentIndex).trimEnd();
				}
			}
		}

		result[name] = value ?? '';
		i++;
	}

	return result;
}

export function updateEnvFile(contents: string, envVars: Record<string, string>): string {
	const lines = contents.split('\n');
	const parsedEnvVars = parseEnvVariables(contents);
	let totalEnvVars = Object.keys(parsedEnvVars).length;

	for (const [name, value] of Object.entries(envVars)) {
		if (parsedEnvVars[name] === undefined) {
			contents += `${totalEnvVars === 0 ? '' : '\n'}${name}=${value}`;
			totalEnvVars++;
		} else {
			if (value === '') continue;

			// Find the variable in the original content
			let found = false;
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]!;
				const lineTrimmed = line.trim();
				if (lineTrimmed.startsWith(`${name}=`)) {
					// Found the start of the variable
					const startIndex = contents.indexOf(line);

					// Check if it's a multi-line value
					const valuePart = lineTrimmed.slice(name.length + 1);
					let endIndex = startIndex + line.length;

					if (valuePart.startsWith('"') && !valuePart.endsWith('"')) {
						// Multi-line value - find the end
						let lineIndex = i + 1;
						while (lineIndex < lines.length) {
							endIndex += lines[lineIndex]!.length + 1; // +1 for newline
							if (lines[lineIndex]!.trim().endsWith('"')) {
								break;
							}
							lineIndex++;
						}
					}

					// Replace the entire variable definition
					const before = contents.slice(0, startIndex);
					const after = contents.slice(endIndex);

					// Determine if we should use quotes (preserve original format if it was quoted)
					const wasQuoted = valuePart.startsWith('"');
					const newValue = wasQuoted ? `"${value}"` : value;

					contents = `${before}${name}=${newValue}${after}`;
					found = true;
					break;
				}
			}

			if (!found) {
				// Fallback to simple replace if we couldn't find it
				contents = contents.replace(`${name}=${parsedEnvVars[name]}`, `${name}=${value}`);
			}
		}
	}

	return contents;
}

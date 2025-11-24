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
	const lines = contents.split('\n').filter((line) => line.trim().length > 0);
	return lines.reduce(
		(acc, line) => {
			const firstEqualIndex = line.indexOf('=');
			if (firstEqualIndex === -1) return acc;
			const name = line.slice(0, firstEqualIndex);
			const value = line.slice(firstEqualIndex + 1);
			acc[name] = value ?? '';
			return acc;
		},
		{} as Record<string, string>
	);
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

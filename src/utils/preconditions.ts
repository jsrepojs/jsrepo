import color from 'chalk';
import { program } from 'commander';
import path from 'pathe';
import semver from 'semver';
import type { Manifest } from '../types';
import * as ASCII from './ascii';
import { cleanVersion, getPackage } from './package';
import type { RegistryProviderState } from './registry-providers';

/** Checks if there are any reasons that the CLI should not proceed and logs warnings or stops execution accordingly.
 *
 * @param providerState
 * @param manifest
 * @returns
 */
export function checkPreconditions(
	providerState: RegistryProviderState,
	manifest: Manifest,
	cwd: string
) {
	if (!manifest.peerDependencies) return;

	const pkg = getPackage(path.join(cwd, 'package.json')).match(
		(v) => v,
		(err) => {
			if (err.endsWith("doesn't exist")) {
				program.error(
					`Couldn't find your ${color.bold('package.json')}. Please create one.`
				);
			}

			program.error(color.red(err));
		}
	);

	const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

	const incompatible: {
		name: string;
		version: string;
		exists: boolean;
		expected: string;
		message?: string;
	}[] = [];

	for (const [name, options] of Object.entries(manifest.peerDependencies)) {
		let expected: string;
		let message: string | undefined = undefined;

		if (typeof options === 'string') {
			expected = options;
		} else {
			expected = options.version;
			message = options.message;
		}

		const version = dependencies[name];

		if (!version) {
			incompatible.push({
				name,
				expected,
				message,
				version,
				exists: false,
			});
			continue;
		}

		if (!semver.satisfies(cleanVersion(version), expected)) {
			incompatible.push({
				name,
				expected,
				message,
				version,
				exists: true,
			});
		}
	}

	if (incompatible.length > 0) {
		process.stdout.write(
			`${ASCII.VERTICAL_LINE}\n${color.yellow('▲')} ${ASCII.JUNCTION_TOP} Issues with ${color.bold(providerState.url)} peer dependencies\n`
		);
		const msgs = incompatible
			.map((dep, i) => {
				const last = incompatible.length - 1 === i;

				let message: string;

				if (dep.exists) {
					message = `${color.yellowBright('x unmet peer')} need ${color.bold(`${dep.name}@`)}${color.greenBright.bold(dep.expected)} >> found ${color.yellowBright.bold(dep.version)}`;
				} else {
					message = `${color.red('x missing peer')} need ${color.bold(`${dep.name}@`)}${color.greenBright.bold(dep.expected)}`;
				}

				const versionMessage = `${ASCII.VERTICAL_LINE} ${last ? ASCII.BOTTOM_LEFT_CORNER : ASCII.JUNCTION_RIGHT}${ASCII.HORIZONTAL_LINE} ${message}`;

				if (!dep.message) {
					return versionMessage;
				}

				return `${versionMessage}\n${ASCII.VERTICAL_LINE} ${!last ? ASCII.VERTICAL_LINE : ''}  ${color.gray(dep.message)}`;
			})
			.join('\n');

		process.stdout.write(`${msgs}\n`);
	}
}

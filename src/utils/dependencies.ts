import color from 'chalk';
import { program } from 'commander';
import { type Agent, resolveCommand } from 'package-manager-detector';
import path from 'pathe';
import { x } from 'tinyexec';
import { flags } from './blocks/package-managers/flags';
import type { ProjectConfig } from './config';
import { taskLog } from './prompts';

export type Options = {
	pm: Agent;
	deps: string[];
	/** Install as devDependency */
	dev: boolean;
	cwd: string;
	ignoreWorkspace?: boolean;
};

/** Installs the provided dependencies using the provided package manager
 *
 * @param param0
 * @returns
 */
export async function installDependencies({
	pm,
	deps,
	dev,
	cwd,
	ignoreWorkspace = false,
}: Options) {
	const args = [...deps];

	if (dev) {
		args.push(flags[pm]['install-as-dev-dependency']);
	}

	const noWorkspace = flags[pm]['no-workspace'];

	if (ignoreWorkspace && noWorkspace) {
		args.push(noWorkspace);
	}

	const add = resolveCommand(pm, 'add', args);

	if (add == null) {
		program.error(color.red(`Could not resolve add command for '${pm}'.`));
	}

	const task = taskLog(`Installing dependencies with ${pm}...`);

	try {
		const proc = x(add.command, [...add.args], { nodeOptions: { cwd } });

		for await (const line of proc) {
			task.text = `${line}\n`;
		}

		task.success(`Installed ${color.cyan(deps.join(', '))}`);
	} catch {
		task.fail('Failed to install dependencies');
		process.exit(2);
	}
}

const templatePattern = /\{\{([^/]+)\/([^}]+)\}\}/g;

export type ResolveOptions = {
	template: string;
	config: ProjectConfig;
	destPath: string;
	cwd: string;
};

/** Takes a template and uses replaces it with an alias or relative path that resolves to the correct block
 *
 * @param param0
 * @returns
 */
export function resolveLocalDependencyTemplate({
	template,
	config,
	destPath,
	cwd,
}: ResolveOptions) {
	const destDir = path.join(destPath, '../');

	return template.replace(templatePattern, (_, category, name) => {
		if (config.paths[category] === undefined) {
			// if relative make it relative
			if (config.paths['*'].startsWith('.')) {
				const relative = path.relative(
					destDir,
					path.join(cwd, config.paths['*'], category, name)
				);

				return relative.startsWith('.') ? relative : `./${relative}`;
			}

			return path.join(config.paths['*'], category, name);
		}

		// if relative make it relative
		if (config.paths[category].startsWith('.')) {
			const relative = path.relative(destDir, path.join(cwd, config.paths[category], name));

			return relative.startsWith('.') ? relative : `./${relative}`;
		}

		return path.join(config.paths[category], name);
	});
}

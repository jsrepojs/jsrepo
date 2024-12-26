import color from 'chalk';
import { execa } from 'execa';
import { type Agent, resolveCommand } from 'package-manager-detector';
import path from 'pathe';
import { flags } from './blocks/package-managers/flags';
import { Err, Ok, type Result } from './blocks/types/result';
import type { ProjectConfig } from './config';

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
const installDependencies = async ({
	pm,
	deps,
	dev,
	cwd,
	ignoreWorkspace = false,
}: Options): Promise<Result<string[], string>> => {
	const args = [...deps];

	if (dev) {
		args.push(flags[pm]['install-as-dev-dependency']);
	}

	const noWorkspace = flags[pm]['no-workspace'];

	if (ignoreWorkspace && noWorkspace) {
		args.push(noWorkspace);
	}

	const add = resolveCommand(pm, 'install', args);

	if (add == null) return Err(color.red(`Could not resolve add command for '${pm}'.`));

	try {
		await execa(add.command, [...add.args], { cwd });

		return Ok(deps);
	} catch {
		return Err(
			color.red(
				`Failed to install ${color.bold(deps.join(', '))}! Failed while running '${color.bold(
					`${add.command} ${add.args.join(' ')}`
				)}'`
			)
		);
	}
};

const templatePattern = /\{\{([^\/]+)\/([^\}]+)\}\}/g;

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
const resolveLocalDependencyTemplate = ({ template, config, destPath, cwd }: ResolveOptions) => {
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
};

export { installDependencies, resolveLocalDependencyTemplate };

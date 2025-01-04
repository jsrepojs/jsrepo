import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { program } from 'commander';
import path from 'pathe';
import * as commands from './commands';
import type { CLIContext } from './utils/context';
import { getLatestVersion } from './utils/get-latest-version';

const resolveRelativeToRoot = (p: string): string => {
	const dirname = fileURLToPath(import.meta.url);
	return path.join(dirname, '../..', p);
};

// get version from package.json
const { version, name, description, repository } = JSON.parse(
	fs.readFileSync(resolveRelativeToRoot('package.json'), 'utf-8')
);

const latestVersion = (await getLatestVersion()).match(
	(val) => val,
	() => undefined
);

const context: CLIContext = {
	package: {
		name,
		description,
		version,
		repository,
		latestVersion,
	},
	resolveRelativeToRoot,
};

const cli = program
	.name(name)
	.description(description)
	.version(version)
	.addCommand(commands.add)
	.addCommand(commands.auth)
	.addCommand(commands.build)
	.addCommand(commands.diff)
	.addCommand(commands.exec)
	.addCommand(commands.init)
	.addCommand(commands.test)
	.addCommand(commands.update);

export { cli, context };

import { program } from 'commander';
import pkg from '@/../package.json';
import * as commands from '@/commands';

const cli = program
	.name(pkg.name)
	.description(pkg.description)
	.version(pkg.version)
	.addCommand(commands.version);

export { cli };

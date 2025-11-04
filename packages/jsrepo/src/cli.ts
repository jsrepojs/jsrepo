import { program } from 'commander';
import pkg from '@/../package.json';
import * as commands from '@/commands';

const cli = program
	.name(pkg.name)
	.description(pkg.description)
	.version(pkg.version)
	.addCommand(commands.add)
	.addCommand(commands.auth)
	.addCommand(commands.build)
	.addCommand(commands.config)
	.addCommand(commands.init)
	.addCommand(commands.update);

export { cli };

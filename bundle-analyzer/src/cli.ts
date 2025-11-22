import { program } from 'commander';
import pkg from '../package.json';
import { analyze } from './commands/analyze';

const cli = program.name(pkg.name).description(pkg.description).addCommand(analyze);

export { cli };

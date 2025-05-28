import fs from 'node:fs';
import { cli } from '../src/cli';

const docsOutput = './cli-reference.md';

const docs = `# ${cli.name()}

> ${cli.description()}
 
Latest Version: ${cli.version()}

## Commands

${cli.commands
	.map((cmd) => {
		return `### ${cmd.name()}
    
${cmd.description()}

#### Usage
\`\`\`bash
${cli.name()} ${cmd.name()} ${cmd.usage()}
\`\`\`

#### Options
${cmd.options
	.map((opt) => {
		let defaultValue = opt.defaultValue;
		if (opt.flags === '--cwd <path>') {
			defaultValue = './';
		}
		return `- ${opt.flags}: ${opt.description} ${defaultValue ? `(default: ${defaultValue})\n` : '\n'}`;
	})
	.join('')}
`;
	})
	.join('')}`;

fs.writeFileSync(docsOutput, docs);

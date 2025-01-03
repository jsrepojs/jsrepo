import fs from 'node:fs';
import { cli } from '../src/cli';

const docsOutput = process.argv.slice(2)[0] ?? 'docs.md';

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
		return `- ${opt.flags}: ${opt.description} ${opt.defaultValue ? `(default: ${opt.defaultValue})\n` : '\n'}`;
	})
	.join('')}
`;
	})
	.join('')}`;

fs.writeFileSync(docsOutput, docs);

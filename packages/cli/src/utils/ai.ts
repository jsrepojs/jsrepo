import * as persisted from './persisted';
import Anthropic from '@anthropic-ai/sdk';

export interface Model {
	name: string;
	mergeFile: (originalFile: string, newFile: string) => Promise<string>;
}

export class ClaudeSonnet implements Model {
	name = 'Claude 3.5 Sonnet';

	private get apiKey() {
		return `${this.name}-api-key`;
	}

	async mergeFile(originalFile: string, newFile: string) {
		const storage = persisted.get();

		const token = storage.get(this.apiKey) as string;

		const anthropic = new Anthropic({ apiKey: token });

		const msg = await anthropic.messages.create({
			model: 'claude-3-5-sonnet-latest',
			max_tokens: 1000,
			temperature: 0.5,
			system: 'You will respond only with the resulting code.',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: `Help me merge these two files. 
This is my current file:
\`\`\`
${originalFile}
\`\`\`

This is the file that has changes I want to update with:
\`\`\`
${newFile}
\`\`\`
`,
						},
					],
				},
			],
		});

		console.log(msg);

		return msg.content[0].text;
	}
}

const models = [new ClaudeSonnet()];

export { models };

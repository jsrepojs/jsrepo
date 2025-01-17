import Anthropic from '@anthropic-ai/sdk';
import { cancel, isCancel, password, spinner } from '@clack/prompts';
import OpenAI from 'openai';
import * as lines from './blocks/utils/lines';
import * as persisted from './persisted';

export interface Model {
	mergeFile: (originalFile: string, newFile: string) => Promise<string>;
}

export type ModelName = 'Claude 3.5 Sonnet' | 'ChatGPT 4o-mini';

/** The prompt given to each model */
const prompt = {
	system: 'You will respond only with the resulting code. DO NOT format the code with markdown, DO NOT put the code inside of triple quotes, only return the code as a raw string.',
	construct: (originalFile: string, newFile: string) => {
		return `Help me merge these two files. 
I want my existing code to work the same as it does while implementing any sensible changes from the new file. 
This is my current file:
\`\`\`
${originalFile}
\`\`\`
	
This is the file that has changes I want to update with:
\`\`\`
${newFile}
\`\`\`
	`;
	},
};

const models: Record<ModelName, Model> = {
	'Claude 3.5 Sonnet': {
		mergeFile: async (originalFile: string, newFile: string) => {
			const key = await getApiKey('Claude 3.5 Sonnet');

			const anthropic = new Anthropic({ apiKey: key });

			const loading = spinner();

			loading.start(`Asking ${'Claude 3.5 Sonnet'}`);

			const msg = await anthropic.messages.create({
				model: 'claude-3-5-sonnet-latest',
				max_tokens: originalFile.length + newFile.length,
				temperature: 0.5,
				system: prompt.system,
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: prompt.construct(originalFile, newFile),
							},
						],
					},
				],
			});

			loading.stop();

			const first = msg.content[0];

			// if we don't get it in the format you want just return the new file
			if (first.type !== 'text') return newFile;

			return unwrapCodeFromQuotes(first.text);
		},
	},
	'ChatGPT 4o-mini': {
		mergeFile: async (originalFile: string, newFile: string) => {
			const key = await getApiKey('ChatGPT 4o-mini');

			const openai = new OpenAI({ apiKey: key });

			const loading = spinner();

			loading.start(`Asking ${'ChatGPT 4o-mini'}`);

			const msg = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: prompt.system,
					},
					{
						role: 'user',
						content: prompt.construct(originalFile, newFile),
					},
				],
			});

			loading.stop();

			const first = msg.choices[0];

			if (first.message.content === null) return newFile;

			return unwrapCodeFromQuotes(first.message.content);
		},
	},
};

/** The AI isn't always that smart and likes to wrap the code in quotes even though I beg it not to.
 *  This function attempts to remove the quotes.
 */
export const unwrapCodeFromQuotes = (quoted: string): string => {
	let code = quoted.trim();

	if (code.startsWith('```')) {
		// takes out the entire first line
		// this is because often a language will come after the triple quotes
		code = lines.get(code).slice(1).join('\n').trim();
	}

	if (code.endsWith('```')) {
		const l = lines.get(code);
		code = l
			.slice(0, l.length - 1)
			.join('\n')
			.trim();
	}

	return code;
};

/** Attempts to get the cached api key if it can't it will prompt the user
 *
 * @param name
 * @returns
 */
const getApiKey = async (name: ModelName): Promise<string> => {
	const KEY = `${name}-api-key`;

	const storage = persisted.get();

	let apiKey = storage.get(KEY, null) as string | null;

	if (!apiKey) {
		// prompt for api key
		const result = await password({
			message: `Paste your api key for ${name}:`,
			validate(value) {
				if (value.trim() === '') return 'Please provide a value';
			},
		});

		if (isCancel(result) || !result) {
			cancel('Canceled!');
			process.exit(0);
		}

		apiKey = result;
	}

	storage.set(KEY, apiKey);

	return apiKey;
};

export { models };

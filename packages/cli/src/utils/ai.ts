import Anthropic from '@anthropic-ai/sdk';
import { cancel, isCancel, password, spinner } from '@clack/prompts';
import OpenAI from 'openai';
import * as lines from './blocks/utils/lines';
import * as persisted from './persisted';

export interface Model {
	updateFile: (originalFile: string, newFile: string) => Promise<string>;
}

export type ModelName = 'Claude 3.5 Sonnet' | 'ChatGPT 4o-mini' | 'ChatGPT 4o';

type Prompt = {
	system: string;
	message: string;
};

const models: Record<ModelName, Model> = {
	'Claude 3.5 Sonnet': {
		updateFile: async (originalFile: string, newFile: string) => {
			const apiKey = await getApiKey('Anthropic');

			const loading = spinner();

			loading.start(`Asking ${'Claude 3.5 Sonnet'}`);

			const text = await getNextCompletionAnthropic({
				model: 'claude-3-5-sonnet-latest',
				prompt: createUpdatePrompt(originalFile, newFile),
				apiKey,
				maxTokens: (originalFile.length + newFile.length) * 2,
			});

			loading.stop();

			if (!text) return newFile;

			return unwrapCodeFromQuotes(text);
		},
	},
	'ChatGPT 4o': {
		updateFile: async (originalFile: string, newFile: string) => {
			const apiKey = await getApiKey('OpenAI');

			const loading = spinner();

			loading.start(`Asking ${'ChatGPT 4o'}`);

			const text = await getNextCompletionOpenAI({
				model: 'gpt-4o',
				prompt: createUpdatePrompt(originalFile, newFile),
				apiKey,
				maxTokens: (originalFile.length + newFile.length) * 2,
			});

			loading.stop();

			if (!text) return newFile;

			return unwrapCodeFromQuotes(text);
		},
	},
	'ChatGPT 4o-mini': {
		updateFile: async (originalFile: string, newFile: string) => {
			const apiKey = await getApiKey('OpenAI');

			const loading = spinner();

			loading.start(`Asking ${'ChatGPT 4o-mini'}`);

			const text = await getNextCompletionOpenAI({
				model: 'gpt-4o-mini',
				prompt: createUpdatePrompt(originalFile, newFile),
				apiKey,
				maxTokens: (originalFile.length + newFile.length) * 2,
			});

			loading.stop();

			if (!text) return newFile;

			return unwrapCodeFromQuotes(text);
		},
	},
};

const getNextCompletionOpenAI = async ({
	prompt,
	maxTokens,
	model,
	apiKey,
}: {
	prompt: Prompt;
	maxTokens: number;
	model: OpenAI.Chat.ChatModel;
	apiKey: string;
}): Promise<string | null> => {
	const openai = new OpenAI({ apiKey });

	const msg = await openai.chat.completions.create({
		model,
		max_tokens: maxTokens,
		messages: [
			{
				role: 'system',
				content: prompt.system,
			},
			{
				role: 'user',
				content: prompt.message,
			},
		],
	});

	const first = msg.choices[0];

	if (first.message.content === null) return null;

	return first.message.content;
};

const getNextCompletionAnthropic = async ({
	prompt,
	maxTokens,
	model,
	apiKey,
}: {
	prompt: Prompt;
	maxTokens: number;
	model: Anthropic.Messages.Model;
	apiKey: string;
}): Promise<string | null> => {
	const anthropic = new Anthropic({ apiKey });

	const msg = await anthropic.messages.create({
		model,
		max_tokens: maxTokens,
		temperature: 0.5,
		system: prompt.system,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: prompt.message,
					},
				],
			},
		],
	});

	const first = msg.content[0];

	// if we don't get it in the format you want just return the new file
	if (first.type !== 'text') return null;

	return first.text;
};

const createUpdatePrompt = (originalFile: string, newFile: string): Prompt => {
	return {
		system: 'You will respond only with the resulting code. DO NOT format the code with markdown, DO NOT put the code inside of triple quotes, only return the code as a raw string.',
		message: `Help me merge these two files. 
I expect the original code to maintain the same behavior as it currently has while including any added functionality from the new file.
This means stuff like defaults or configuration should normally stay intact unless the new behaviors in the new file depend on those defaults or configuration.
This is my current file:
\`\`\`
${originalFile}
\`\`\`
	
This is the file that has changes I want to update with:
\`\`\`
${newFile}
\`\`\`
	`,
	};
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
const getApiKey = async (name: 'OpenAI' | 'Anthropic'): Promise<string> => {
	const KEY = `${name}-api-key`;

	const storage = persisted.get();

	let apiKey = storage.get(KEY, null) as string | null;

	if (!apiKey) {
		// prompt for api key
		const result = await password({
			message: `Paste your ${name} API key:`,
			validate(value) {
				if (value.trim() === '') return 'Please provide an API key';
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

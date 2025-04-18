import { cancel, confirm, isCancel, log, outro, password, select, text } from '@clack/prompts';
import color from 'chalk';
import { Command } from 'commander';
import * as v from 'valibot';
import { intro, spinner } from '../utils/prompts';
import path from 'pathe';
import * as tar from 'tar';
import fs from 'node:fs';
import fetch from 'node-fetch';

const schema = v.object({
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

export const publish = new Command('publish')
	.description('Publish a registry to jsrepo.com.')
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		await intro();

		await _publish(options);

		outro(color.green('All done!'));
	});

async function _publish(options: Options) {
	const dest = 'jsrepo-package.tar.gz';

	const files = fs.readdirSync(path.resolve(options.cwd, 'temp-registry'));

	await tar.create(
		{
			z: true,
			cwd: path.resolve(options.cwd, 'temp-registry'),
			file: dest,
		},
		files
	);

	const tarBuffer = fs.readFileSync(path.resolve(options.cwd, dest));

	const response = await fetch('http://localhost:5173/api/registries/publish', {
		body: tarBuffer,
		headers: {
			'content-type': 'application/gzip',
			'content-encoding': 'gzip',
			'x-api-key': 'PLSvimGZbGqeHpbahhUDKgGQkYFpBpyiHHcKkEjZDxeDOqkxKvcHyFSnOYwpJaya',
		},
		method: 'POST',
	});

	if (!response.ok) {
		const res = (await response.json()) as { message: string };

		console.error(`${response.status} ${res.message}`);
	} else {
		console.log('Completed publish!');
	}
}

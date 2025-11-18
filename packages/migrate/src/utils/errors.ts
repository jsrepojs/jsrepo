import pc from 'picocolors';
import type { z } from 'zod';

export type CLIError =
	| JsrepoError
	| NoPackageJsonFoundError
	| InvalidOptionsError
	| InvalidJSONError
	| ManifestNotFoundError;

export class JsrepoError extends Error {
	private readonly suggestion: string;
	private readonly docsLink?: string;
	constructor(
		message: string,
		options: {
			suggestion: string;
			docsLink?: string;
		}
	) {
		super(message);

		this.suggestion = options.suggestion;
		this.docsLink = options.docsLink;
	}

	toString() {
		return `${this.message} ${this.suggestion}${pc.gray(this.docsLink ? `\n   See: ${this.docsLink}` : '')}`;
	}
}

export class NoPackageJsonFoundError extends JsrepoError {
	constructor() {
		super('No package.json found.', {
			suggestion:
				'Please run create a package.json first before initializing a jsrepo project.',
		});
	}
}

export class ManifestNotFoundError extends JsrepoError {
	constructor({ path }: { path: string }) {
		super(`Manifest not found at ${pc.bold(path)}.`, {
			suggestion:
				'This is a bug, please report it here: https://github.com/jsrepojs/jsrepo/issues',
		});
	}
}

export class InvalidOptionsError extends JsrepoError {
	constructor(error: z.ZodError) {
		super(
			`Invalid options: ${error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
			{
				suggestion: 'Please check the options and try again.',
			}
		);
	}
}

export class ZodError extends JsrepoError {
	readonly zodError: z.ZodError;
	constructor(error: z.ZodError) {
		super(`Zod error: ${error.message}`, {
			suggestion: 'Check the input schema and try again.',
		});
		this.zodError = error;
	}
}

export class InvalidJSONError extends JsrepoError {
	constructor(error: unknown) {
		super(
			`Invalid JSON: ${error instanceof Error ? (error.stack ?? error.message) : `${error}`}`,
			{
				suggestion: 'Check the input JSON and try again.',
			}
		);
	}
}

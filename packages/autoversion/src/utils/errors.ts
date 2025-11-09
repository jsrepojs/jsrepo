import type { z } from "zod";

export type CLIError = AutoVersionError | ZodError | InvalidJSONError | InvalidOptionsError | Unreachable;

export class AutoVersionError extends Error {
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
		// TODO: look into formatting this better
		return `${this.message} ${this.suggestion}${this.docsLink ? `\n\nSee: ${this.docsLink}` : ""}`;
	}
}

export class InvalidOptionsError extends AutoVersionError {
	constructor(error: z.ZodError) {
		super(
			`Invalid options: ${error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
			{
				suggestion: 'Please check the options and try again.',
			}
		);
	}
}

export class ZodError extends AutoVersionError {
	readonly zodError: z.ZodError;
	constructor(error: z.ZodError) {
		console.log(error.issues);
		super(`Zod error: ${error.message}`, {
			suggestion: "Check the input schema and try again.",
		});
		this.zodError = error;
	}
}

export class InvalidJSONError extends AutoVersionError {
	constructor(error: unknown) {
		super(`Invalid JSON: ${error instanceof Error ? error.stack ?? error.message : `${error}`}`, {
			suggestion: "Check the input JSON and try again.",
		});
	}
}

/**
 * This error is thrown when a code path should be unreachable.
 */
export class Unreachable extends AutoVersionError {
	constructor() {
		super("This code path should be unreachable.", {
			suggestion: "This is a bug, please report it.",
		});
	}
}

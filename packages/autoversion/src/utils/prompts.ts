import {
	intro as _intro,
	spinner as _spinner,
	log,
} from '@clack/prompts';
import isUnicodeSupported from 'is-unicode-supported';
import pc from 'picocolors';
import pkg from '@/../package.json';

export const isTTY = process.stdout.isTTY;

export function intro() {
	console.clear();

	_intro(`${pc.bgYellow(pc.black(` ${pkg.name} `))}${pc.gray(` v${pkg.version} `)}`);
}

function createVerboseLogger({
	options,
}: {
	options: { verbose: boolean };
}): (msg: string) => void {
	return (msg: string) => {
		if (!options.verbose) return;
		log.info(msg);
	};
}

export type Spinner = ReturnType<typeof spinner>;

/**
 * Creates a verbose logger and a spinner. We don't want to use a spinner in verbose mode because we often want to log within spinners and maintain the logs.
 *
 * @param param0
 * @returns
 */
export function initLogging({ options }: { options: { verbose: boolean } }) {
	const verbose = createVerboseLogger({ options });
	return {
		verbose,
		spinner: spinner({ verbose: options.verbose ? verbose : undefined }),
	};
}

/** A spinner compatible with verbose logging
 *
 * @param param0
 * @returns
 */
function spinner({
	verbose,
}: {
	verbose?: (msg: string) => void;
} = {}): ReturnType<typeof _spinner> {
	const loading = _spinner();

	return {
		message: (msg) => {
			if (verbose) {
				verbose(msg ?? '');
			} else {
				loading.message(msg);
			}
		},
		stop: (msg) => {
			if (verbose) {
				verbose(msg ?? '');
			} else {
				loading.stop(msg);
			}
		},
		start: (msg) => {
			if (verbose) {
				verbose(msg ?? '');
			} else {
				loading.start(msg);
			}
		},
		get isCancelled() {
			return loading.isCancelled;
		},
	};
}

export { outro } from '@clack/prompts';

const unicode = isUnicodeSupported();

const s = (c: string, fallback: string) => (unicode ? c : fallback);

export const VERTICAL_LINE = pc.gray(s('│', '|'));

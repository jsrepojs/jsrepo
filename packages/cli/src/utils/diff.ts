import color from 'chalk';
import { type Change, diffChars } from 'diff';
import { arraySum } from './blocks/utils/array-sum';
import * as lines from './blocks/utils/lines';
import { leftPadMin } from './blocks/utils/pad';

type Options = {
	/** The source file */
	from: string;
	/** The destination file */
	to: string;
	/** The changes to the file */
	changes: Change[];
	/** Expands all lines to show the entire file */
	expand: boolean;
	/** Maximum lines to show before collapsing */
	maxUnchanged: number;
	/** Color the removed lines */
	colorRemoved?: (line: string) => string;
	/** Color the added lines */
	colorAdded?: (line: string) => string;
	/** Color the removed chars */
	colorCharsRemoved?: (line: string) => string;
	/** Color the added chars */
	colorCharsAdded?: (line: string) => string;
	/** Prefixes each line with the string returned from this function. */
	prefix: () => string;
	intro: (options: Options) => string;
	onUnchanged: (options: Options) => string;
};

/** Check if a character is whitespace
 *
 * @param str
 * @returns
 */
const isWhitespace = (str: string) => /^\s+$/g.test(str);

/** We need to add a newline at the end of each change to make sure
 * the next change can start correctly. So we take off just 1.
 *
 * @param str
 * @returns
 */
const trimSingleNewLine = (str: string): string => {
	let i = str.length - 1;
	while (isWhitespace(str[i]) && i >= 0) {
		if (str[i] === '\n') {
			if (str[i - 1] === '\r') {
				return str.slice(0, i - 1);
			}

			return str.slice(0, i);
		}

		i--;
	}

	return str;
};

const formatDiff = ({
	from,
	to,
	changes,
	expand = false,
	maxUnchanged = 5,
	colorRemoved = color.redBright,
	colorAdded = color.greenBright,
	colorCharsRemoved = color.bgRedBright,
	colorCharsAdded = color.bgGreenBright,
	prefix,
	onUnchanged,
	intro,
}: Options): string => {
	let result = '';

	const length = arraySum(changes, (change) => change.count ?? 0).toString().length + 1;

	let lineOffset = 0;

	if (changes.length === 1 && !changes[0].added && !changes[0].removed) {
		return onUnchanged({
			from,
			to,
			changes,
			expand,
			maxUnchanged,
			colorAdded,
			colorRemoved,
			prefix,
			onUnchanged,
			intro,
		});
	}

	result += intro({
		from,
		to,
		changes,
		expand,
		maxUnchanged,
		colorAdded,
		colorRemoved,
		prefix,
		onUnchanged,
		intro,
	});

	/** Provides the line number prefix */
	const linePrefix = (line: number): string =>
		color.gray(`${prefix?.() ?? ''}${leftPadMin(`${line + 1 + lineOffset} `, length)} `);

	for (let i = 0; i < changes.length; i++) {
		const change = changes[i];

		const hasPreviousChange = changes[i - 1]?.added || changes[i - 1]?.removed;
		const hasNextChange = changes[i + 1]?.added || changes[i + 1]?.removed;

		if (!change.added && !change.removed) {
			// show collapsed
			if (!expand && change.count !== undefined && change.count > maxUnchanged) {
				const prevLineOffset = lineOffset;
				const ls = lines.get(trimSingleNewLine(change.value));

				let shownLines = 0;

				if (hasNextChange) shownLines += maxUnchanged;
				if (hasPreviousChange) shownLines += maxUnchanged;

				// just show all if we are going to show more than we have
				if (shownLines >= ls.length) {
					result += `${lines.join(ls, {
						prefix: linePrefix,
					})}\n`;
					lineOffset += ls.length;
					continue;
				}

				// this writes the top few lines
				if (hasPreviousChange) {
					result += `${lines.join(ls.slice(0, maxUnchanged), {
						prefix: linePrefix,
					})}\n`;
				}

				if (ls.length > shownLines) {
					const count = ls.length - shownLines;
					result += `${lines.join(
						lines.get(
							color.gray(
								`+ ${count} more unchanged (${color.italic('-E to expand')})`
							)
						),
						{
							prefix: () => `${prefix?.() ?? ''}${leftPadMin(' ', length)} `,
						}
					)}\n`;
				}

				if (hasNextChange) {
					lineOffset = lineOffset + ls.length - maxUnchanged;
					result += `${lines.join(ls.slice(ls.length - maxUnchanged), {
						prefix: linePrefix,
					})}\n`;
				}

				// resets the line offset
				lineOffset = prevLineOffset + change.count;
				continue;
			}

			// show expanded

			result += `${lines.join(lines.get(trimSingleNewLine(change.value)), {
				prefix: linePrefix,
			})}\n`;
			lineOffset += change.count ?? 0;

			continue;
		}

		const colorLineChange = (change: Change) => {
			if (change.added) {
				return colorAdded(trimSingleNewLine(change.value));
			}

			if (change.removed) {
				return colorRemoved(trimSingleNewLine(change.value));
			}

			return change.value;
		};

		const colorCharChange = (change: Change) => {
			if (change.added) {
				return colorCharsAdded(trimSingleNewLine(change.value));
			}

			if (change.removed) {
				return colorCharsRemoved(trimSingleNewLine(change.value));
			}

			return change.value;
		};

		if (
			change.removed &&
			change.count === 1 &&
			changes[i + 1]?.added &&
			changes[i + 1]?.count === 1
		) {
			// single line change
			const diffedChars = diffChars(change.value, changes[i + 1].value);

			const sentence = diffedChars.map((chg) => colorCharChange(chg)).join('');

			result += `${linePrefix(0)}${sentence}`;

			lineOffset += 1;

			i++;
		} else {
			if (isWhitespace(change.value)) {
				// adds some spaces to make sure that you can see the change
				result += `${lines.join(lines.get(colorCharChange(change)), {
					prefix: (line) =>
						`${linePrefix(line)}${colorCharChange({ removed: true, value: '   ', added: false })}`,
				})}\n`;

				if (!change.removed) {
					lineOffset += change.count ?? 0;
				}
			} else {
				result += `${lines.join(lines.get(colorLineChange(change)), {
					prefix: linePrefix,
				})}\n`;

				if (!change.removed) {
					lineOffset += change.count ?? 0;
				}
			}
		}
	}

	return result;
};

export { formatDiff };

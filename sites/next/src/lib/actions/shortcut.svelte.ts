/*
	Installed from github/ieedan/shadcn-svelte-extras
*/

export type Options = {
	/** Event to use to detect the shortcut @default 'keydown' */
	event?: 'keydown' | 'keyup' | 'keypress';
	/** Function to be called when the shortcut is pressed */
	callback: (e: KeyboardEvent) => void;
	/** Should the `Shift` key be pressed */
	shift?: boolean;
	/** Should the `Ctrl` / `Command` key be pressed */
	ctrl?: boolean;
	/** Should the `Alt` key be pressed */
	alt?: boolean;
	/** Which key should be pressed */
	key: Key;
	/** Control whether or not the shortcut prevents default behavior @default true */
	preventDefault?: boolean;
	/** Control whether or not the shortcut stops propagation @default false */
	stopPropagation?: boolean;
};

/** Allows you to configure one or more shortcuts based on the key events of an element.
 *
 * ## Usage
 * ```svelte
 * <!-- Ctrl + K Shortcut -->
 * <svelte:window use:shortcut={
 * 			{
 * 				ctrl: true,
 * 				key: 'k',
 * 				callback: commandMenu.toggle
 * 			}
 * 		}
 * />
 * ```
 */
export const shortcut = (node: HTMLElement, options: Options[] | Options) => {
	const handleKeydown = (e: KeyboardEvent, options: Options) => {
		if (options.ctrl && !e.ctrlKey && !e.metaKey) return;

		if (options.alt && !e.altKey) return;

		if (options.shift && !e.shiftKey) return;

		if (e.key.toLocaleLowerCase() !== options.key.toLocaleLowerCase()) return;

		if (options.preventDefault === undefined || options.preventDefault) {
			e.preventDefault();
		}

		if (options.stopPropagation) {
			e.stopPropagation();
		}

		options.callback(e);
	};

	$effect(() => {
		let optionsArr: Options[] = [];
		if (Array.isArray(options)) {
			optionsArr = options;
		} else {
			optionsArr = [options];
		}

		for (const opt of optionsArr) {
			node.addEventListener(opt.event ?? 'keydown', (e) => handleKeydown(e, opt));
		}

		return () => {
			for (const opt of optionsArr) {
				node.removeEventListener(opt.event ?? 'keydown', (e) => handleKeydown(e, opt));
			}
		};
	});
};

export type Key =
	| 'backspace'
	| 'tab'
	| 'enter'
	| 'shift(left)'
	| 'shift(right)'
	| 'ctrl(left)'
	| 'ctrl(right)'
	| 'alt(left)'
	| 'alt(right)'
	| 'pause/break'
	| 'caps lock'
	| 'escape'
	| 'space'
	| 'page up'
	| 'page down'
	| 'end'
	| 'home'
	| 'left arrow'
	| 'up arrow'
	| 'right arrow'
	| 'down arrow'
	| 'print screen'
	| 'insert'
	| 'delete'
	| '0'
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6'
	| '7'
	| '8'
	| '9'
	| 'a'
	| 'b'
	| 'c'
	| 'd'
	| 'e'
	| 'f'
	| 'g'
	| 'h'
	| 'i'
	| 'j'
	| 'k'
	| 'l'
	| 'm'
	| 'n'
	| 'o'
	| 'p'
	| 'q'
	| 'r'
	| 's'
	| 't'
	| 'u'
	| 'v'
	| 'w'
	| 'x'
	| 'y'
	| 'z'
	| 'left window key'
	| 'right window key'
	| 'select key (Context Menu)'
	| 'numpad 0'
	| 'numpad 1'
	| 'numpad 2'
	| 'numpad 3'
	| 'numpad 4'
	| 'numpad 5'
	| 'numpad 6'
	| 'numpad 7'
	| 'numpad 8'
	| 'numpad 9'
	| 'multiply'
	| 'add'
	| 'subtract'
	| 'decimal point'
	| 'divide'
	| 'f1'
	| 'f2'
	| 'f3'
	| 'f4'
	| 'f5'
	| 'f6'
	| 'f7'
	| 'f8'
	| 'f9'
	| 'f10'
	| 'f11'
	| 'f12'
	| 'num lock'
	| 'scroll lock'
	| 'audio volume mute'
	| 'audio volume down'
	| 'audio volume up'
	| 'media player'
	| 'launch application 1'
	| 'launch application 2'
	| 'semi-colon'
	| 'equal sign'
	| 'comma'
	| 'dash'
	| 'period'
	| 'forward slash'
	| 'Backquote/Grave accent'
	| 'open bracket'
	| 'back slash'
	| 'close bracket'
	| 'single quote';

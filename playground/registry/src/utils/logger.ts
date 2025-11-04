import color from 'chalk';
import { noop } from '../lib/utils';
import { print } from './stdout';

export class Logger {
	warn(msg: string, onLog = noop) {
		print(color.yellow(msg));
		onLog();
	}

	error(msg: string, onLog = noop) {
		print(color.red(msg));
		onLog();
	}
}

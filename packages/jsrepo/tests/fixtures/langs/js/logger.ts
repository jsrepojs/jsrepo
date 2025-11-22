import color from 'picocolors';
import { print } from './stdout';

export class Logger {
	warn(msg: string) {
		print(color.yellow(msg));
	}

	error(msg: string) {
		print(color.red(msg));
	}
}

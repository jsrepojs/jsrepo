import color from 'chalk';
import { print } from '../stdout';

export function answerFormat(answer: number) {
	return print(color.green(`The answer is ${answer}`));
}

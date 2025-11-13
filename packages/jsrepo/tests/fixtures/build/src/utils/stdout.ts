import { STDOUT_PREFIX } from "../utils";

export function print(msg: string) {
	console.log(STDOUT_PREFIX + msg);
}

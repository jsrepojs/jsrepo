import type { add } from "./math/add";
import type { subtract } from "./math/subtract";
import { print } from "./stdout";

export function printAnswer(fn: typeof add | typeof subtract) {
	print(String(fn(1, 2)));
}
